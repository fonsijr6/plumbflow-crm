import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Phone, Mail, MapPin, Calendar, StickyNote,
  Clock, Pencil, Plus, Trash2, FileText,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getClient, updateClient } from "@/api/ClientApi";
import { getTasks, createTask, updateTask, deleteTask } from "@/api/TaskApi";
import { getInvoices } from "@/api/InvoiceApi";
import { Client, Task, Invoice } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectContent, SelectValue, SelectItem,
} from "@/components/ui/select";

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

const invoiceStatusLabel: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
};

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: client, isLoading: loadingClient, isError } = useQuery({
    queryKey: ["client", id],
    queryFn: () => getClient(id!),
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => getTasks(id),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => getInvoices(id),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Client> }) =>
      updateClient(id, payload),
    onSuccess: () => {
      toast.success("Cliente actualizado");
      queryClient.invalidateQueries({ queryKey: ["client", id] });
    },
    onError: () => toast.error("Error actualizando cliente"),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success("Tarea creada");
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onError: () => toast.error("Error creando tarea"),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Task> }) =>
      updateTask(id, payload),
    onSuccess: () => {
      toast.success("Tarea actualizada");
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onError: () => toast.error("Error actualizando tarea"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Tarea eliminada");
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onError: () => toast.error("Error eliminando tarea"),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openEditClient = () => {
    if (!client) return;
    setForm(client);
    setEditOpen(true);
  };

  const saveClient = () => {
    if (!form.name?.trim()) return toast.error("El nombre es obligatorio");
    updateClientMutation.mutate({ id: id!, payload: form });
    setEditOpen(false);
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskForm({
      clientId: id!,
      clientName: client?.name,
      address: client?.address,
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
    if (!taskForm.description?.trim()) return toast.error("La descripción es obligatoria");
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, payload: taskForm });
    } else {
      createTaskMutation.mutate(taskForm as Partial<Task>);
    }
    setTaskOpen(false);
  };

  if (loadingClient) {
    return <p className="py-12 text-center text-muted-foreground">Cargando cliente...</p>;
  }

  if (isError || !client) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/clients")}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/clients")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a clientes
      </button>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cliente desde{" "}
            {new Date(client.createdAt!).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openEditClient}>
          <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
        </Button>
      </div>

      {/* GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CONTACTO */}
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-base">Datos de contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[client.phone, client.email, client.address].map((text, i) => {
              const Icon = [Phone, Mail, MapPin][i];
              return (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{text}</span>
                </div>
              );
            })}
            {client.notes && (
              <div className="flex gap-2.5 text-sm border-t pt-2 text-muted-foreground">
                <StickyNote className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{client.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TAREAS */}
        <Card className="border shadow-sm">
          <CardHeader className="flex-row justify-between">
            <CardTitle className="text-base">Historial de tareas</CardTitle>
            <Button variant="outline" size="sm" onClick={openNewTask}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nueva tarea
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-3">
                {!tasks?.length ? (
                  <p className="text-sm text-muted-foreground">Sin tareas registradas</p>
                ) : (
                  tasks.map((t) => (
                    <div key={t.id} className="flex items-start gap-3 border p-3 rounded-lg group">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(t.date).toLocaleDateString("es-ES")} — {t.time}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{statusLabel[t.status]}</Badge>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 shrink-0" onClick={() => openEditTask(t)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive h-7 w-7 shrink-0" onClick={() => deleteTaskMutation.mutate(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* FACTURAS DEL CLIENTE */}
      <Card className="border shadow-sm">
        <CardHeader className="flex-row justify-between">
          <CardTitle className="text-base">Facturas</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
            <FileText className="mr-1 h-3.5 w-3.5" /> Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {!invoices?.length ? (
                <p className="text-sm text-muted-foreground">Sin facturas registradas</p>
              ) : (
                invoices.map((inv: Invoice) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.date).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">{inv.total?.toFixed(2)} €</span>
                      <Badge variant="outline" className="text-xs">{invoiceStatusLabel[inv.status]}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* EDIT CLIENT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" />
            <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono" />
            <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección" />
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveClient}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TASK DIALOG */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Descripción *</Label>
            <Input value={taskForm.description || ""} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha</Label><Input type="date" value={taskForm.date || ""} onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })} /></div>
              <div><Label>Hora</Label><Input type="time" value={taskForm.time || ""} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} /></div>
            </div>
            <Label>Dirección</Label>
            <Input value={taskForm.address || ""} onChange={(e) => setTaskForm({ ...taskForm, address: e.target.value })} />
            {editingTask && (
              <>
                <Label>Estado</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as Task["status"] })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancelar</Button>
            <Button onClick={saveTask}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;
