import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { clientsApi } from "@/api/clientsApi";
import { tasksApi } from "@/api/tasksApi";
import { invoicesApi } from "@/api/invoicesApi";
import { quotesApi } from "@/api/quotesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/common/PageLoader";
import { Users, CalendarDays, FileText, Receipt, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const DashboardPage = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const { data: clients, isLoading: lc } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list(),
    enabled: hasPermission("clients", "view"),
  });

  const { data: tasks, isLoading: lt } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(),
    enabled: hasPermission("tasks", "view"),
  });

  const { data: invoices, isLoading: li } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.list(),
    enabled: hasPermission("invoices", "view"),
  });

  const { data: quotes, isLoading: lq } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => quotesApi.list(),
    enabled: hasPermission("quotes", "view"),
  });

  const isLoading = lc || lt || li || lq;

  const todayTasks = (tasks || []).filter((t) => {
    if (!t.date) return false;
    const today = new Date().toISOString().slice(0, 10);
    return t.date.slice(0, 10) === today;
  });

  const pendingTasks = (tasks || []).filter((t) => t.status === "pending");

  const stats = [
    { label: "Clientes", value: clients?.length ?? 0, icon: Users, to: "/clients", color: "text-primary", perm: hasPermission("clients", "view") },
    { label: "Avisos pendientes", value: pendingTasks.length, icon: CalendarDays, to: "/tasks", color: "text-warning", perm: hasPermission("tasks", "view") },
    { label: "Facturas", value: invoices?.length ?? 0, icon: FileText, to: "/invoices", color: "text-success", perm: hasPermission("invoices", "view") },
    { label: "Presupuestos", value: quotes?.length ?? 0, icon: Receipt, to: "/quotes", color: "text-accent", perm: hasPermission("quotes", "view") },
  ].filter((s) => s.perm);

  if (isLoading) return <PageLoader text="Cargando dashboard…" />;

  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    in_progress: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completado",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-center">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Panel de control</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(s.to)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={cn("h-8 w-8", s.color)} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasPermission("tasks", "view") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Avisos de hoy</CardTitle>
            <button onClick={() => navigate("/tasks")} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay avisos para hoy</p>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((t) => (
                  <div key={t._id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tasks/${t._id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{t.title}</p>
                      {t.client && <p className="text-xs text-muted-foreground">{t.client.name}</p>}
                    </div>
                    <Badge className={cn("ml-2 text-xs", statusColor[t.status])}>
                      {statusLabel[t.status] || t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
