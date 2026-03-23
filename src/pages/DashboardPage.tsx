import { useState, useMemo } from "react";
import { mockTareas, mockClientes, mockStock } from "@/data/mockData";
import { Users, Package, CalendarDays, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const estadoColor: Record<string, string> = {
  pendiente: "bg-warning/15 text-warning-foreground border-warning/30",
  en_progreso: "bg-primary/10 text-primary border-primary/30",
  completada: "bg-success/15 text-success border-success/30",
};

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

const DashboardPage = () => {
  const [dayOffset, setDayOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const tareasDelDia = mockTareas.filter((t) => t.fecha === dateStr);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de tu actividad</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Clientes", value: mockClientes.length, icon: Users },
          { label: "Productos en stock", value: mockStock.reduce((a, s) => a + s.cantidad, 0), icon: Package },
          { label: "Tareas hoy", value: mockTareas.filter((t) => t.fecha === new Date().toISOString().split("T")[0]).length, icon: CalendarDays },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agenda carousel */}
      <Card className="border shadow-sm">
        <CardHeader className="flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold">Agenda del día</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDayOffset((p) => p - 1)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[180px] text-center text-sm font-medium capitalize">
              {dayOffset === 0 ? "Hoy" : dayOffset === 1 ? "Mañana" : dayOffset === -1 ? "Ayer" : ""}{" "}
              — {formatDate(selectedDate)}
            </span>
            <button
              onClick={() => setDayOffset((p) => p + 1)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {tareasDelDia.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay tareas programadas para este día
                </p>
              ) : (
                tareasDelDia.map((tarea) => (
                  <div
                    key={tarea.id}
                    className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{tarea.descripcion}</p>
                        <Badge variant="outline" className={estadoColor[tarea.estado]}>
                          {estadoLabel[tarea.estado]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{tarea.clienteNombre}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {tarea.hora}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {tarea.direccion}
                        </span>
                      </div>
                    </div>
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
