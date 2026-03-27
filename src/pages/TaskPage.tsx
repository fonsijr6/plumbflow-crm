import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Clock, MapPin, Play, CheckCircle, Loader2, Plus, Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, createTask, updateTask } from "@/api/TaskApi";
import { getClients } from "@/api/ClientApi";
import { Task, Client } from "@/data/mockData";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { validateTaskForm } from "@/lib/validators";

const statusColor: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
};
const statusLabel: Record<string, string> = {
  pending: "Pendiente", in_progress: "En progreso", completed: "Completada",
};

const TasksPage = () => {
  const navigate = useNavigate();
  const [dayOffset, setDayOffset] = useState(0);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + dayOffset); return d; }, [dayOffset]);
  const dateStr = selectedDate.toISOString().split("T")[0];

  const { data: tasks, isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: getClients });

  const tasksOfDay = tasks?.filter((t: Task) => t.date === dateStr) ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Task> }) => updateTask(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: () => toast.error("Error actualizando aviso"),
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => { toast.success("Aviso creado"); queryClient.invalidateQueries({ queryKey: ["tasks"] }); setDialogOpen(false); setFieldErrors({}); },
    onError: () => toast.error("Error creando aviso"),
  });

  const handleStatus = (id: string, status: "pending" | "in_progress" | "completed") => {
    const next = status === "pending" ? "in_progress" : "completed";
    updateMutation.mutate({ id, payload: { status: next } });
    toast.success(next === "in_progress" ? "Aviso iniciado" : "Aviso completado");
  };

  const openNewTask = () => {
    setTaskForm({ description: "", date: dateStr, time: "09:00", status: "pending", address: "", clientId: "", clientName: "" });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const selectClient = (clientId: string) => {
    const c = clients?.find((cl: Client) => cl.id === clientId);
    if (c) setTaskForm({ ...taskForm, clientId: c.id, clientName: c.name, address: c.address });
  };

  const isFormValid = useMemo(() => {
    if (!taskForm.description?.trim()) return false;
    if (!taskForm.date) return false;
    if (!taskForm.time) return false;
    if (!taskForm.clientId) return false;
    return true;
  }, [taskForm]);

  const handleSaveTask = () => {
    const errors = validateTaskForm(taskForm);
    if (errors.length) {
      const map: Record<string, string> = {};
      errors.forEach((e) => (map[e.field] = e.message));
      setFieldErrors(map);
      toast.error(errors[0].message);
      return;
    }
    if (!taskForm.clientId) { toast.error("Selecciona un cliente"); return; }
    setFieldErrors({});
    createMutation.mutate(taskForm as Partial<Task>);
  };

  const formatDate = (d: Date) => d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = -3; i <= 3; i++) { const d = new Date(); d.setDate(d.getDate() + dayOffset + i); days.push(d); }
    return days;
  }, [dayOffset]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <Home className="h-4 w-4" /> Volver a inicio
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Planifica tu trabajo</p>
        </div>
        <Button onClick={openNewTask} size="sm"><Plus className="mr-1 h-4 w-4" /> Nuevo aviso</Button>
      </div>

      {/* Week strip */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button onClick={() => setDayOffset((p) => p - 1)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 justify-center gap-0.5 sm:gap-1 overflow-hidden">
          {weekDays.map((d, i) => {
            const dStr = d.toISOString().split("T")[0];
            const isSelected = dStr === dateStr;
            const isToday = dStr === new Date().toISOString().split("T")[0];
            const hasTasks = tasks?.some((t: Task) => t.date === dStr) ?? false;
            return (
              <button key={i} onClick={() => setDayOffset((prev) => prev + (i - 3))}
                className={`flex flex-col items-center rounded-lg px-2 sm:px-3 py-2 text-xs transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"}`}>
                <span className="uppercase font-medium">{d.toLocaleDateString("es-ES", { weekday: "short" })}</span>
                <span className={`text-base sm:text-lg font-semibold ${isSelected ? "" : "text-foreground"}`}>{d.getDate()}</span>
                {hasTasks && !isSelected && <div className="h-1 w-1 rounded-full bg-primary mt-0.5" />}
                {isToday && !isSelected && <div className="h-0.5 w-3 rounded-full bg-accent mt-0.5" />}
              </button>
            );
          })}
        </div>
        <button onClick={() => setDayOffset((p) => p + 1)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary shrink-0">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-center text-sm font-medium capitalize">{formatDate(selectedDate)}</p>

      <AnimatePresence mode="wait">
        <motion.div key={dateStr} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-3">
          {tasksOfDay.length === 0 ? (
            <Card className="border shadow-sm"><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">No hay avisos para este día</p></CardContent></Card>
          ) : (
            tasksOfDay.map((task) => (
              <Card key={task.id} className="border shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                <CardContent className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">{task.time.split(":")[0]}h</div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-sm">{task.description}</p>
                      <Badge variant="outline" className={statusColor[task.status]}>{statusLabel[task.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.clientName}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 self-start">
                    {task.status !== "completed" && (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleStatus(task.id, task.status); }} disabled={updateMutation.isPending}>
                        {task.status === "pending" ? (<><Play className="mr-1 h-3 w-3" /> Empezar</>) : (<><CheckCircle className="mr-1 h-3 w-3" /> Completar</>)}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* DIALOG - Nuevo aviso */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo aviso</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={taskForm.clientId || ""} onValueChange={selectClient}>
                <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                <SelectContent>{clients?.map((c: Client) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Input maxLength={150} placeholder="Descripción del aviso" value={taskForm.description || ""} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className={fieldErrors.description ? "border-destructive" : ""} />
              {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input type="date" value={taskForm.date || ""} onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })} className={fieldErrors.date ? "border-destructive" : ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora *</Label>
                <Input type="time" value={taskForm.time || ""} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} className={fieldErrors.time ? "border-destructive" : ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input maxLength={150} placeholder="Dirección del aviso" value={taskForm.address || ""} onChange={(e) => setTaskForm({ ...taskForm, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTask} disabled={createMutation.isPending || !isFormValid}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Crear aviso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
