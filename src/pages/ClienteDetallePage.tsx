import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { Cliente, Tarea } from "@/data/mockData";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, StickyNote, Clock, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ClienteDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientes, updateCliente, tareas, addTarea, updateTarea, deleteTarea } = useData();

  const cliente = clientes.find((c) => c.id === id);
  const tareasCliente = tareas.filter((t) => t.clienteId === id);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Cliente | null>(null);

  const [tareaOpen, setTareaOpen] = useState(false);
  const [tareaForm, setTareaForm] = useState<Partial<Tarea>>({});
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button variant="ghost" onClick={() => navigate("/clientes")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  const openEditCliente = () => { setForm({ ...cliente }); setEditOpen(true); };
  const saveCliente = () => {
    if (!form) return;
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    updateCliente(form);
    toast.success("Cliente actualizado");
    setEditOpen(false);
  };

  const openNewTarea = () => {
    setEditingTarea(null);
    setTareaForm({
      clienteId: cliente.id, clienteNombre: cliente.nombre,
      direccion: cliente.direccion, descripcion: "", fecha: new Date().toISOString().split("T")[0],
      hora: "09:00", estado: "pendiente",
    });
    setTareaOpen(true);
  };

  const openEditTarea = (t: Tarea) => {
    setEditingTarea(t);
    setTareaForm({ ...t });
    setTareaOpen(true);
  };

  const saveTarea = () => {
    if (!tareaForm.descripcion?.trim()) { toast.error("La descripción es obligatoria"); return; }
    if (editingTarea) {
      updateTarea({ ...editingTarea, ...tareaForm } as Tarea);
      toast.success("Tarea actualizada");
    } else {
      addTarea(tareaForm as Omit<Tarea, "id">);
      toast.success("Tarea creada");
    }
    setTareaOpen(false);
  };

  const handleDeleteTarea = (tId: string) => {
    deleteTarea(tId);
    toast.success("Tarea eliminada");
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/clientes")} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cliente.nombre}</h1>
          <p className="text-sm text-muted-foreground mt-1">Cliente desde {new Date(cliente.fechaAlta).toLocaleDateString("es-ES", { year: "numeric", month: "long" })}</p>
        </div>
        <Button variant="outline" size="sm" onClick={openEditCliente}>
          <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-base">Datos de contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Phone, label: cliente.telefono },
              { icon: Mail, label: cliente.email },
              { icon: MapPin, label: cliente.direccion },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <Icon className="h-4 w-4 text-muted-foreground" /><span>{label}</span>
              </div>
            ))}
            {cliente.notas && (
              <div className="flex items-start gap-2.5 text-sm pt-2 border-t">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{cliente.notas}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Historial de tareas</CardTitle>
            <Button variant="outline" size="sm" onClick={openNewTarea}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nueva tarea
            </Button>
          </CardHeader>
          <CardContent>
            {tareasCliente.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin tareas registradas</p>
            ) : (
              <div className="space-y-3">
                {tareasCliente.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 rounded-lg border p-3 group">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(t.fecha).toLocaleDateString("es-ES")} — {t.hora}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {t.estado === "pendiente" ? "Pendiente" : t.estado === "en_progreso" ? "En progreso" : "Completada"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEditTarea(t)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDeleteTarea(t.id)}>
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

      {/* Edit cliente dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Dirección</Label><Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Notas</Label><Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveCliente}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tarea dialog */}
      <Dialog open={tareaOpen} onOpenChange={setTareaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingTarea ? "Editar tarea" : "Nueva tarea"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Descripción *</Label><Input value={tareaForm.descripcion || ""} onChange={(e) => setTareaForm({ ...tareaForm, descripcion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={tareaForm.fecha || ""} onChange={(e) => setTareaForm({ ...tareaForm, fecha: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Hora</Label><Input type="time" value={tareaForm.hora || ""} onChange={(e) => setTareaForm({ ...tareaForm, hora: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Dirección</Label><Input value={tareaForm.direccion || ""} onChange={(e) => setTareaForm({ ...tareaForm, direccion: e.target.value })} /></div>
            {editingTarea && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={tareaForm.estado} onValueChange={(v) => setTareaForm({ ...tareaForm, estado: v as Tarea["estado"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTareaOpen(false)}>Cancelar</Button>
            <Button onClick={saveTarea}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClienteDetallePage;
