import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, TaskPayload } from "@/api/tasksApi";
import { clientsApi } from "@/api/clientsApi";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { IfPermission } from "@/components/common/IfPermission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TaskPayload>({ title: "" });

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
  });

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => clientsApi.list() });

  const updateMut = useMutation({
    mutationFn: (p: Partial<TaskPayload>) => tasksApi.update(id!, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task", id] }); qc.invalidateQueries({ queryKey: ["tasks"] }); setEditing(false); toast.success("Aviso actualizado"); },
  });

  const uploadMut = useMutation({
    mutationFn: (fd: FormData) => tasksApi.uploadImages(id!, fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["task", id] }); toast.success("Imágenes subidas"); },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("images", f));
    uploadMut.mutate(fd);
  };

  const statusColor: Record<string, string> = { pending: "bg-warning/10 text-warning", in_progress: "bg-primary/10 text-primary", completed: "bg-success/10 text-success" };
  const statusLabel: Record<string, string> = { pending: "Pendiente", in_progress: "En progreso", completed: "Completado" };
  const nextStatus: Record<string, string> = { pending: "in_progress", in_progress: "completed" };
  const nextLabel: Record<string, string> = { pending: "Iniciar", in_progress: "Finalizar" };

  if (isLoading || !task) return <PageLoader />;

  return (
    <div>
      <PageHeader title={task.title} backTo="/tasks" backLabel="Volver a avisos"
        actions={
          <div className="flex gap-2">
            {nextStatus[task.status] && (
              <IfPermission module="tasks" action="complete">
                <Button onClick={() => updateMut.mutate({ status: nextStatus[task.status] })} disabled={updateMut.isPending}>
                  {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {nextLabel[task.status]}
                </Button>
              </IfPermission>
            )}
            <IfPermission module="tasks" action="edit">
              <Button variant="outline" onClick={() => {
                setForm({ title: task.title, description: task.description, clientId: task.clientId || task.client?._id, date: task.date?.slice(0, 10), address: task.address });
                setEditing(true);
              }}>
                Editar
              </Button>
            </IfPermission>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Estado:</span> <Badge className={cn("ml-1 text-xs", statusColor[task.status])}>{statusLabel[task.status]}</Badge></div>
            {task.client && <div><span className="text-muted-foreground">Cliente:</span> <button onClick={() => navigate(`/clients/${task.client!._id}`)} className="ml-1 text-primary hover:underline">{task.client.name}</button></div>}
            {task.description && <div><span className="text-muted-foreground">Descripción:</span> <span className="ml-1">{task.description}</span></div>}
            {task.address && <div><span className="text-muted-foreground">Dirección:</span> <span className="ml-1">{task.address}</span></div>}
            {task.date && <div><span className="text-muted-foreground">Fecha:</span> <span className="ml-1">{new Date(task.date).toLocaleDateString("es-ES")}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Imágenes</CardTitle>
            <IfPermission module="tasks" action="edit">
              <label className="cursor-pointer">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" /> Subir
                </div>
              </label>
            </IfPermission>
          </CardHeader>
          <CardContent>
            {(!task.images || task.images.length === 0) ? (
              <p className="text-sm text-muted-foreground">Sin imágenes</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {task.images.map((src, i) => (
                  <img key={i} src={src} alt={`Imagen ${i + 1}`} className="rounded-lg object-cover aspect-square" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar aviso</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Título *</Label><Input maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Input maxLength={150} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Dirección</Label><Input maxLength={150} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={!form.title?.trim() || updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskDetailPage;
