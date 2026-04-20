import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi, CreateEmployeePayload } from "@/api/employeesApi";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const MODULES = ["clients", "tasks", "invoices", "quotes", "products", "stock"];
const ALL_ACTIONS = ["view", "create", "edit", "assign", "complete", "delete"];
const MODULE_ACTIONS: Record<string, string[]> = {
  clients: ["view", "create", "edit", "delete"],
  tasks: ["view", "create", "edit", "assign", "complete", "delete"],
  invoices: ["view", "create", "edit", "delete"],
  quotes: ["view", "create", "edit", "delete", "convert"],
  products: ["view", "create", "edit", "delete"],
  stock: ["view", "edit"],
};

const EmployeesPage = () => {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [permModal, setPermModal] = useState<string | null>(null);
  const [form, setForm] = useState<CreateEmployeePayload>({ name: "", email: "", password: "", role: "worker" });
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: string }>({ name: "", email: "", role: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});

  const { data: employees = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: () => employeesApi.list() });

  const createMut = useMutation({
    mutationFn: (p: CreateEmployeePayload) => employeesApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setModal(false); setForm({ name: "", email: "", password: "", role: "worker" }); toast.success("Empleado creado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Partial<{ name: string; email: string; role: string }> }) => employeesApi.update(id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setEditModal(null); toast.success("Empleado actualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setDeleteId(null); toast.success("Empleado eliminado"); },
  });

  const permMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Record<string, Record<string, boolean>> }) => employeesApi.updatePermissions(id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setPermModal(null); toast.success("Permisos actualizados"); },
  });

  const togglePerm = (mod: string, act: string) => {
    setPerms((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [act]: !prev[mod]?.[act] },
    }));
  };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Empleados" backTo="/dashboard" backLabel="Volver a inicio"
        actions={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Nuevo empleado</Button>}
      />

      <DataTable
        columns={[
          { key: "name", header: "Nombre" },
          { key: "email", header: "Email", className: "hidden sm:table-cell" },
          { key: "role", header: "Rol", render: (r: any) => <Badge variant="outline" className="capitalize">{r.role}</Badge> },
          {
            key: "actions", header: "", className: "w-36",
            render: (row: any) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditForm({ name: row.name, email: row.email, role: row.role }); setEditModal(row._id); }}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setPerms(row.permissions || {}); setPermModal(row._id); }}>
                  <Shield className="h-3.5 w-3.5" />
                </Button>
                {row._id !== currentUser?._id && (
                  <Button variant="ghost" size="sm" className="text-destructive h-8 px-2"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(row._id); }}>
                    Eliminar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={employees as any}
        emptyMessage="No hay empleados"
      />

      {/* Create */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo empleado</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" maxLength={150} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contraseña *</Label><Input type="password" maxLength={50} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={!form.name.trim() || !form.email.trim() || !form.password.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear empleado
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar empleado</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editModal && updateMut.mutate({ id: editModal, p: editForm }); }} className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input maxLength={150} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" maxLength={150} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={!editForm.name.trim() || !editForm.email.trim() || updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions editor */}
      <Dialog open={!!permModal} onOpenChange={() => setPermModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Permisos del empleado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Módulo</th>
                    {ALL_ACTIONS.concat("convert").filter((v, i, a) => a.indexOf(v) === i).map((a) => (
                      <th key={a} className="pb-2 font-medium capitalize text-center text-xs">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod) => {
                    const actions = MODULE_ACTIONS[mod];
                    return (
                      <tr key={mod} className="border-b last:border-0">
                        <td className="py-2 capitalize">{mod}</td>
                        {ALL_ACTIONS.concat("convert").filter((v, i, a) => a.indexOf(v) === i).map((act) => (
                          <td key={act} className="py-2 text-center">
                            {actions.includes(act) ? (
                              <Checkbox checked={!!perms[mod]?.[act]} onCheckedChange={() => togglePerm(mod, act)} />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Button className="w-full" onClick={() => permModal && permMut.mutate({ id: permModal, p: perms })} disabled={permMut.isPending}>
              {permMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar permisos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Eliminar empleado" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
};

export default EmployeesPage;
