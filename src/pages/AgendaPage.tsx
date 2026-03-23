import { useState, useMemo } from "react";
import { mockTareas } from "@/data/mockData";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
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

const AgendaPage = () => {
  const [dayOffset, setDayOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const tareasDelDia = mockTareas.filter((t) => t.fecha === dateStr);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Week view
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset + i);
      days.push(d);
    }
    return days;
  }, [dayOffset]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">Planifica tus trabajos</p>
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
            const isSelected = d.toISOString().split("T")[0] === dateStr;
            const isToday = d.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
            const hasTasks = mockTareas.some((t) => t.fecha === d.toISOString().split("T")[0]);
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
                  {d.toLocaleDateString("es-ES", { weekday: "short" })}
                </span>
                <span className={`text-lg font-semibold ${isSelected ? "" : "text-foreground"}`}>
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

      <p className="text-center text-sm font-medium capitalize">{formatDate(selectedDate)}</p>

      {/* Tasks */}
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
            <Card className="border shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No hay tareas para este día</p>
              </CardContent>
            </Card>
          ) : (
            tareasDelDia.map((tarea) => (
              <Card key={tarea.id} className="border shadow-sm transition-all hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                    {tarea.hora.split(":")[0]}h
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
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tarea.hora}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tarea.direccion}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AgendaPage;
