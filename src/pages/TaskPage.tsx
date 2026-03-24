import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Play,
  CheckCircle,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getTasks, updateTask } from "@/api/TaskApi";
import { Task } from "@/data/mockData";

const statusColor: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
};

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

const TasksPage = () => {
  const [dayOffset, setDayOffset] = useState(0);
  const queryClient = useQueryClient();

  // ✅ Fecha seleccionada
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const dateStr = selectedDate.toISOString().split("T")[0];

  // ✅ GET tasks reales del backend
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", dateStr],
    queryFn: () => getTasks(), // backend puede filtrar por clientId, pero no por fecha
  });

  const tasksOfDay = tasks?.filter((t: Task) => t.date === dateStr) ?? [];

  // ✅ Cambiar estado real de la tarea
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Task> }) =>
      updateTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Error updating task");
    },
  });

  const handleStatus = (
    id: string,
    status: "pending" | "in_progress" | "completed",
  ) => {
    const next = status === "pending" ? "in_progress" : "completed";

    updateMutation.mutate({
      id,
      payload: { status: next },
    });

    toast.success(
      next === "in_progress" ? "Tarea iniciada" : "Tarea completada",
    );
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // ✅ Strip de 7 días (3 antes, hoy, 3 después)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset + i);
      days.push(d);
    }
    return days;
  }, [dayOffset]);

  if (isLoading) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Cargando tareas...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* TITULO */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Planifica tu trabajo
        </p>
      </div>

      {/* Week strip */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDayOffset((p) => p - 1)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-1 justify-center gap-1">
          {weekDays.map((d, i) => {
            const dStr = d.toISOString().split("T")[0];
            const isSelected = dStr === dateStr;
            const isToday = dStr === new Date().toISOString().split("T")[0];
            const hasTasks = tasks?.some((t: Task) => t.date === dStr) ?? false;

            return (
              <button
                key={i}
                onClick={() => setDayOffset((prev) => prev + (i - 3))}
                className={`flex flex-col items-center rounded-lg px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary text-muted-foreground"
                }`}
              >
                <span className="uppercase font-medium">
                  {d.toLocaleDateString("es-ES", {
                    weekday: "short",
                  })}
                </span>

                <span
                  className={`text-lg font-semibold ${
                    isSelected ? "" : "text-foreground"
                  }`}
                >
                  {d.getDate()}
                </span>

                {hasTasks && !isSelected && (
                  <div className="h-1 w-1 rounded-full bg-primary mt-0.5" />
                )}

                {isToday && !isSelected && (
                  <div className="h-0.5 w-3 rounded-full bg-accent mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setDayOffset((p) => p + 1)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Fecha grande */}
      <p className="text-center text-sm font-medium capitalize">
        {formatDate(selectedDate)}
      </p>

      {/* Lista */}
      <AnimatePresence mode="wait">
        <motion.div
          key={dateStr}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {tasksOfDay.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay tareas para este día
                </p>
              </CardContent>
            </Card>
          ) : (
            tasksOfDay.map((task) => (
              <Card
                key={task.id}
                className="border shadow-sm transition-all hover:shadow-md"
              >
                <CardContent className="flex items-start gap-4 p-4">
                  {/* HORA */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    {task.time.split(":")[0]}h
                  </div>

                  {/* INFO */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{task.description}</p>

                      <Badge
                        variant="outline"
                        className={statusColor[task.status]}
                      >
                        {statusLabel[task.status]}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {task.clientName}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.time}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {task.address}
                      </span>
                    </div>
                  </div>

                  {/* BOTÓN CAMBIO DE ESTADO */}
                  {task.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 mt-1"
                      onClick={() => handleStatus(task.id, task.status)}
                      disabled={updateMutation.isPending}
                    >
                      {task.status === "pending" ? (
                        <>
                          <Play className="mr-1 h-3 w-3" /> Empezar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" /> Completar
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
