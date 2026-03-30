import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, TaskPayload } from "@/api/tasksApi";
import { clientsApi } from "@/api/clientsApi";
import { IfPermission } from "@/components/common/IfPermission";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emptyTask: TaskPayload = { title: "", description: "", clientId: "", date: "", address: "" };

const TasksPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<TaskPayload>(emptyTask);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => tasksApi.list() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => clientsApi.list() });

  const createMut = useMutation({
    mutationFn: (p: TaskPayload) => tasksApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setModal(false); setForm(emptyTask); toast.success("Aviso creado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setDeleteId(null); toast.success("Aviso eliminado"); },
  });

  const filtered = tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const statusColor: Record<string, string> = { pending: "bg-warning/10 text-warning", in_progress: "bg-primary/10 text-primary", completed: "bg-success/10 text-success" };
  const statusLabel: Record<string, string> = { pending: "Pendiente", in_progress: "En progreso", completed: "Completado" };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Avisos" backTo="/dashboard" backLabel="Volver a inicio"
        actions={
          <IfPermission module="tasks" action="create">
            <Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Nuevo aviso</Button>
          </IfPermission>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar aviso…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={[
          { key: "title", header: "Título" },
          { key: "client", header: "Cliente", className: "hidden sm:table-cell", render: (r) => r.client?.name || "—" },
          { key: "status", header: "Estado", render: (r) => <Badge className={cn("text-xs", statusColor[r.status])}>{statusLabel[r.status]}</Badge> },
          { key: "date", header: "Fecha", className: "hidden md:table-cell", render: (r) => r.date ? new Date(r.date).toLocaleDateString("es-ES") : "—" },
          {
            key: "actions", header: "", className: "w-10",
            render: (row) => (
              <IfPermission module="tasks" action="delete">
                <Button variant="ghost" size="sm" className="text-destructive h-8 px-2"
                  onClick={(e) => { e.stopPropagation(); setDeleteId(row._id); }}>
                  Eliminar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filtered as any}
        onRowClick={(row: any) => navigate(`/tasks/${row._id}`)}
        emptyMessage="No hay avisos"
      />

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo aviso</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Título *</Label><Input maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Descripción</Label><Input maxLength={150} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Dirección</Label><Input maxLength={150} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={!form.title.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear aviso
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Eliminar aviso" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
};

export default TasksPage;
