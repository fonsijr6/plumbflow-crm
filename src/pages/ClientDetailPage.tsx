import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { Client, Task } from "@/data/mockData";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  StickyNote,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, updateClient, tasks, addTask, updateTask, deleteTask } =
    useData();

  const client = clients.find((c) => c.id === id);
  const tasksclient = tasks.filter((t) => t.clientId === id);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Client | null>(null);

  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button
          variant="ghost"
          onClick={() => navigate("/clients")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  const openEditClient = () => {
    setForm({ ...client });
    setEditOpen(true);
  };
  const saveclient = () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    updateClient(form);
    toast.success("Cliente actualizado");
    setEditOpen(false);
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskForm({
      clientId: client.id,
      clientName: client.name,
      address: client.address,
      description: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      status: "pending",
    });
    setTaskOpen(true);
  };

  const openEditTask = (t: Task) => {
    setEditingTask(t);
    setTaskForm({ ...t });
    setTaskOpen(true);
  };

  const saveTask = () => {
    if (!taskForm.description?.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    if (editingTask) {
      updateTask({ ...editingTask, ...taskForm } as Task);
      toast.success("Task actualizada");
    } else {
      addTask(taskForm as Omit<Task, "id">);
      toast.success("Task creada");
    }
    setTaskOpen(false);
  };

  const handleDeleteTask = (tId: string) => {
    deleteTask(tId);
    toast.success("Task eliminada");
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a clients
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {client.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            client desde{" "}
            {new Date(client.createdAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openEditClient}>
          <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Datos de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Phone, label: client.phone },
              { icon: Mail, label: client.email },
              { icon: MapPin, label: client.address },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </div>
            ))}
            {client.notes && (
              <div className="flex items-start gap-2.5 text-sm pt-2 border-t">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{client.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Historial de tareas</CardTitle>
            <Button variant="outline" size="sm" onClick={openNewTask}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nueva tarea
            </Button>
          </CardHeader>
          <CardContent>
            {tasksclient.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin atareas registradas
              </p>
            ) : (
              <div className="space-y-3">
                {tasksclient.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 rounded-lg border p-3 group"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(t.date).toLocaleDateString("es-ES")} —{" "}
                        {t.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {t.status === "pending"
                          ? "pending"
                          : t.status === "in_progress"
                            ? "En progreso"
                            : "Completada"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openEditTask(t)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => handleDeleteTask(t.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit client dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveclient}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Editar Task" : "Nueva Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Input
                value={taskForm.description || ""}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={taskForm.date || ""}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>time</Label>
                <Input
                  type="time"
                  value={taskForm.time || ""}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input
                value={taskForm.address || ""}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, address: e.target.value })
                }
              />
            </div>
            {editingTask && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(v) =>
                    setTaskForm({ ...taskForm, status: v as Task["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTask}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;
