/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validateClientForm, validateTaskForm, isValidEmail, isValidPhone } from "@/lib/validators";
import {
  ChevronLeft, Phone, Mail, MapPin, Calendar, StickyNote, Clock, Pencil, Plus, Trash2, FileText, Loader2, Camera, X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getClient, updateClient, deleteClient } from "@/api/ClientApi";
import { getTasks, createTask, updateTask, deleteTask } from "@/api/TaskApi";
import { getInvoices } from "@/api/InvoiceApi";
import { Client, Task, Invoice } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { uploadImageToCloudinary } from "@/utils/uploadImage";
import ConfirmDialog from "@/components/ConfirmDialog";

const statusLabel: Record<string, string> = { pending: "Pendiente", in_progress: "En progreso", completed: "Completada" };
const invoiceStatusLabel: Record<string, string> = { draft: "Borrador", sent: "Enviada", paid: "Pagada", overdue: "Vencida" };

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: client, isLoading: loadingClient, isError } = useQuery({ queryKey: ["client", id], queryFn: () => getClient(id!) });
  const { data: tasks } = useQuery({ queryKey: ["tasks", id], queryFn: () => getTasks(id) });
  const { data: invoices } = useQuery({ queryKey: ["invoices", id], queryFn: () => getInvoices(id!), enabled: !!id });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Client> }) => updateClient(id, payload),
    onSuccess: () => { toast.success("Cliente actualizado"); queryClient.invalidateQueries({ queryKey: ["client", id] }); },
    onError: () => toast.error("Error actualizando cliente"),
  });

  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => { toast.success("Cliente eliminado"); navigate("/clients"); },
    onError: () => toast.error("Error eliminando cliente"),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => { toast.success("Aviso creado"); queryClient.invalidateQueries({ queryKey: ["tasks", id] }); },
    onError: () => toast.error("Error creando aviso"),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Task> }) => updateTask(id, payload),
    onSuccess: () => { toast.success("Aviso actualizado"); queryClient.invalidateQueries({ queryKey: ["tasks", id] }); },
    onError: () => toast.error("Error actualizando aviso"),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => { toast.success("Aviso eliminado"); queryClient.invalidateQueries({ queryKey: ["tasks", id] }); },
    onError: () => toast.error("Error eliminando aviso"),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [invoiceStartDate, setInvoiceStartDate] = useState("");
  const [invoiceEndDate, setInvoiceEndDate] = useState("");
  const [deleteClientOpen, setDeleteClientOpen] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<string | null>(null);

  const filteredTasks = tasks?.filter((t) => {
    const matchesStatus = taskStatusFilter === "all" || t.status === taskStatusFilter;
    const date = new Date(t.date);
    const from = taskStartDate ? new Date(taskStartDate) : null;
    const to = taskEndDate ? new Date(taskEndDate) : null;
    return matchesStatus && (!from || date >= from) && (!to || date <= to);
  });

  const filteredInvoices = invoices?.filter((inv) => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) || inv.clientName.toLowerCase().includes(invoiceSearch.toLowerCase());
    const matchesStatus = invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;
    const date = new Date(inv.date);
    const from = invoiceStartDate ? new Date(invoiceStartDate) : null;
    const to = invoiceEndDate ? new Date(invoiceEndDate) : null;
    return matchesSearch && matchesStatus && (!from || date >= from) && (!to || date <= to);
  });

  const isEditClientValid = useMemo(() => {
    if (!form.name?.trim()) return false;
    if (form.phone && !isValidPhone(form.phone)) return false;
    if (form.email && !isValidEmail(form.email)) return false;
    return true;
  }, [form]);

  const isTaskFormValid = useMemo(() => {
    if (!taskForm.description?.trim()) return false;
    if (!taskForm.date) return false;
    if (!taskForm.time) return false;
    return true;
  }, [taskForm]);

  const openEditClient = () => { if (!client) return; setForm(client); setEditFieldErrors({}); setEditOpen(true); };

  const saveClient = () => {
    const errors = validateClientForm({ name: form.name || "", phone: form.phone || "", email: form.email || "" });
    if (errors.length) {
      const map: Record<string, string> = {};
      errors.forEach((e) => (map[e.field] = e.message));
      setEditFieldErrors(map);
      toast.error(errors[0].message);
      return;
    }
    setEditFieldErrors({});
    updateClientMutation.mutate({ id: id!, payload: form });
    setEditOpen(false);
  };

  const handleModalPhotoChange = async (files: FileList | null) => {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map((f) => uploadImageToCloudinary(f)));
    setTaskForm((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskForm({ clientId: id!, clientName: client?.name, address: client?.address, description: "", date: new Date().toISOString().split("T")[0], time: "09:00", status: "pending" });
    setTaskOpen(true);
  };

  const openEditTask = (t: Task) => { setEditingTask(t); setTaskForm({ ...t }); setTaskOpen(true); };

  const saveTask = () => {
    const errors = validateTaskForm(taskForm);
    if (errors.length) { toast.error(errors[0].message); return; }
    if (editingTask) { updateTaskMutation.mutate({ id: editingTask.id, payload: taskForm }); }
    else { createTaskMutation.mutate(taskForm as Partial<Task>); }
    setTaskOpen(false);
  };

  if (loadingClient) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (isError || !client) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/clients")}><ChevronLeft className="mr-2 h-4 w-4" /> Volver</Button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="sticky top-0 z-30 bg-background border-b pb-4 pt-3 space-y-4">
        <button onClick={() => navigate("/clients")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Volver a clientes
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cliente desde {new Date(client.createdAt!).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEditClient}><Pencil className="mr-1 h-3.5 w-3.5" /> Editar</Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteClientOpen(true)}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* DATOS CONTACTO */}
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-base">Datos de contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[client.phone, client.email, client.address].map((text, i) => {
              const Icon = [Phone, Mail, MapPin][i];
              return <div key={i} className="flex items-center gap-2.5 text-sm"><Icon className="h-4 w-4 text-muted-foreground shrink-0" /><span className="truncate">{text}</span></div>;
            })}
            {client.notes && (
              <div className="flex gap-2.5 text-sm border-t pt-2 text-muted-foreground"><StickyNote className="h-4 w-4 mt-0.5 shrink-0" /><span>{client.notes}</span></div>
            )}
          </CardContent>
        </Card>

        {/* AVISOS */}
        <Card className="border shadow-sm">
          <CardHeader className="sticky top-0 z-20 bg-card border-b flex-row justify-between items-center">
            <CardTitle className="text-base">Historial de avisos</CardTitle>
            <Button variant="outline" size="sm" onClick={openNewTask}><Plus className="mr-1 h-3.5 w-3.5" /> Nuevo aviso</Button>
          </CardHeader>
          <div className="px-4 py-3 flex flex-col sm:flex-row gap-3 border-b bg-card">
            <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)} className="w-full sm:w-[160px]" />
            <Input type="date" value={taskEndDate} onChange={(e) => setTaskEndDate(e.target.value)} className="w-full sm:w-[160px]" />
          </div>
          <CardContent className="p-0">
            <div className="relative">
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent z-10" />
              <ScrollArea className="h-64">
                <div className="space-y-3 px-4 pb-4 pt-6">
                  {!filteredTasks?.length ? (
                    <p className="text-sm text-muted-foreground">Sin avisos</p>
                  ) : (
                    filteredTasks.map((t) => (
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
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive h-7 w-7 shrink-0" onClick={() => setDeleteTaskTarget(t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent z-10" />
            </div>
          </CardContent>
        </Card>

        {/* FACTURAS */}
        <Card className="border shadow-sm">
          <CardHeader className="flex-row justify-between items-center sticky top-0 z-20 bg-card border-b">
            <CardTitle className="text-base">Facturas</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/invoices?new=${id}`)}><Plus className="mr-1 h-3.5 w-3.5" /> Crear factura</Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/invoices?client=${encodeURIComponent(client.name)}`)}>
                <FileText className="mr-1 h-3.5 w-3.5" /> Ver todas
              </Button>
            </div>
          </CardHeader>
          <div className="px-4 py-3 flex flex-col sm:flex-row gap-3 border-b bg-card">
            <Input placeholder="Buscar factura..." value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} className="w-full sm:w-48" />
            <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={invoiceStartDate} onChange={(e) => setInvoiceStartDate(e.target.value)} className="w-full sm:w-[160px]" />
            <Input type="date" value={invoiceEndDate} onChange={(e) => setInvoiceEndDate(e.target.value)} className="w-full sm:w-[160px]" />
          </div>
          <CardContent className="p-0">
            <div className="relative">
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent z-10" />
              <ScrollArea className="h-64">
                <div className="space-y-2 px-4 pb-4 pt-6">
                  {!filteredInvoices?.length ? (
                    <p className="text-sm text-muted-foreground">Sin facturas registradas</p>
                  ) : (
                    filteredInvoices.map((inv: Invoice) => (
                      <div key={inv.id} className="flex items-center justify-between border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/invoices/${inv.id}`, { state: { fromClient: id } })}>
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString("es-ES")}</p>
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
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent z-10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EDIT CLIENT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input maxLength={150} value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={editFieldErrors.name ? "border-destructive" : ""} />
              {editFieldErrors.name && <p className="text-xs text-destructive">{editFieldErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={editFieldErrors.phone ? "border-destructive" : ""} />
              {editFieldErrors.phone && <p className="text-xs text-destructive">{editFieldErrors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input maxLength={150} value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={editFieldErrors.email ? "border-destructive" : ""} />
              {editFieldErrors.email && <p className="text-xs text-destructive">{editFieldErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input maxLength={150} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea maxLength={500} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <p className="text-xs text-muted-foreground text-right">{(form.notes || "").length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveClient} disabled={updateClientMutation.isPending || !isEditClientValid}>
              {updateClientMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TASK DIALOG */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? "Editar aviso" : "Nuevo aviso"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Input maxLength={150} placeholder="Descripción del aviso" value={taskForm.description || ""} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={taskForm.date || ""} onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Hora</Label><Input type="time" value={taskForm.time || ""} onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input maxLength={150} placeholder="Dirección" value={taskForm.address || ""} onChange={(e) => setTaskForm({ ...taskForm, address: e.target.value })} />
            </div>
            {editingTask && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En progreso</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Fotos</Label>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1" onClick={() => fileInputRef.current?.click()}>
                <Camera className="h-4 w-4" /> Añadir fotos
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => handleModalPhotoChange(e.target.files)} />
              {taskForm.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {taskForm.images.map((img: string, i: number) => (
                    <div key={i} className="relative group">
                      <img src={img} className="w-full h-24 object-cover rounded border" />
                      <button type="button" onClick={() => { const newImages = taskForm.images!.filter((_: any, index: number) => index !== i); setTaskForm({ ...taskForm, images: newImages }); }}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancelar</Button>
            <Button onClick={saveTask} disabled={(createTaskMutation.isPending || updateTaskMutation.isPending) || !isTaskFormValid}>
              {(createTaskMutation.isPending || updateTaskMutation.isPending) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : editingTask ? "Guardar cambios" : "Crear aviso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteClientOpen} onOpenChange={setDeleteClientOpen} title="Eliminar cliente" description="¿Seguro que quieres eliminar este cliente y todos sus datos? Esta acción no se puede deshacer."
        onConfirm={() => deleteClientMutation.mutate(id!)} loading={deleteClientMutation.isPending} />

      <ConfirmDialog open={!!deleteTaskTarget} onOpenChange={(open) => !open && setDeleteTaskTarget(null)} title="Eliminar aviso" description="¿Seguro que quieres eliminar este aviso?"
        onConfirm={() => deleteTaskTarget && deleteTaskMutation.mutate(deleteTaskTarget)} loading={deleteTaskMutation.isPending} />
    </div>
  );
};

export default ClientDetailPage;
