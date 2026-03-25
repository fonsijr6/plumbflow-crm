import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Package,
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients } from "@/api/ClientApi";
import { getStock } from "@/api/StockApi";
import { getTasks, updateTask } from "@/api/TaskApi";
import { getInvoices } from "@/api/InvoiceApi";
import { Task } from "@/data/mockData";

const estadoColor: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
};

const estadoLabel: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

const DashboardPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dayOffset, setDayOffset] = useState(0);

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: getClients });
  const { data: stock } = useQuery({ queryKey: ["stock"], queryFn: getStock });
  const { data: tasks } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });
  const { data: invoices } = useQuery({ queryKey: ["invoices"], queryFn: () => getInvoices() });

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const tareasDelDia = tasks?.filter((t: Task) => t.date === dateStr) ?? [];

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task["status"] }) =>
      updateTask(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: () => toast.error("Error actualizando el estado de la tarea"),
  });

  const handleEstado = (id: string, status: Task["status"]) => {
    const next = status === "pending" ? "in_progress" : "completed";
    updateMutation.mutate({ id, status: next });
    toast.success(next === "in_progress" ? "Tarea iniciada" : "Tarea finalizada");
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {user?.name || "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de tu actividad</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Clientes", value: clients?.length ?? 0, icon: Users },
          { label: "Stock", value: stock?.reduce((a, i) => a + i.quantity, 0) ?? 0, icon: Package },
          { label: "Facturas", value: invoices?.length ?? 0, icon: FileText },
          {
            label: "Tareas hoy",
            value: tasks?.filter((t: Task) => t.date === new Date().toISOString().split("T")[0]).length ?? 0,
            icon: CalendarDays,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AGENDA */}
      <Card className="border shadow-sm">
        <CardHeader className="flex-col sm:flex-row sm:justify-between gap-3">
          <CardTitle className="text-lg font-semibold">Agenda del día</CardTitle>
          <div className="flex items-center gap-2">
            <button onClick={() => setDayOffset((p) => p - 1)} className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] sm:min-w-[180px] text-center text-sm font-medium capitalize">
              {dayOffset === 0 ? "Hoy" : dayOffset === 1 ? "Mañana" : dayOffset === -1 ? "Ayer" : ""}
              {" — "}{formatDate(selectedDate)}
            </span>
            <button onClick={() => setDayOffset((p) => p + 1)} className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {tareasDelDia.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay tareas programadas para este día
                </p>
              ) : (
                tareasDelDia.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <p className="text-sm font-medium">{task.description}</p>
                        <Badge variant="outline" className={estadoColor[task.status]}>
                          {estadoLabel[task.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.clientName}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.address}</span>
                      </div>
                    </div>

                    {task.status !== "completed" && (
                      <Button variant="outline" size="sm" className="shrink-0 self-start" onClick={() => handleEstado(task.id, task.status)}>
                        {task.status === "pending" ? (
                          <><Play className="mr-1 h-3 w-3" /> Iniciar</>
                        ) : (
                          <><CheckCircle className="mr-1 h-3 w-3" /> Finalizar</>
                        )}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
