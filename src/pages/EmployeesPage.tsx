/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Shield } from "lucide-react";

import { employeesApi, CreateEmployeePayload } from "@/api/employeesApi";
import { useAuth } from "@/contexts/AuthContext";

import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODULES = ["clients", "tasks", "invoices", "quotes", "products", "stock", "users"];

const MODULE_ACTIONS: Record<string, string[]> = {
  clients: ["view", "create", "edit", "delete"],
  tasks: ["view", "create", "edit", "assign", "complete", "delete"],
  invoices: ["view", "create", "edit", "send", "pay", "cancel"],
  quotes: ["view", "create", "edit", "delete", "convert"],
  products: ["view", "create", "edit", "delete"],
  stock: ["view", "edit"],
  users: ["view", "create", "edit", "delete"],
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  worker: "Operario",
  viewer: "Visualizador",
};

export default function EmployeesPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const [createModal, setCreateModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [permId, setPermId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateEmployeePayload>({
    name: "",
    email: "",
    password: "",
    role: "worker",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "worker" as any,
  });

  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>({});

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: employeesApi.list,
  });

  const createMut = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setCreateModal(false);
      setCreateForm({ name: "", email: "", password: "", role: "worker" });
      toast.success("Empleado creado");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.msg || "Error al crear empleado"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      employeesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditId(null);
      toast.success("Empleado actualizado");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.msg || "Error al actualizar"),
  });

  const deleteMut = useMutation({
    mutationFn: employeesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setDeleteId(null);
      toast.success("Empleado eliminado");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.msg || "Error al eliminar"),
  });

  const permMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, Record<string, boolean>>;
    }) => employeesApi.updatePermissions(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      setPermId(null);
      toast.success("Permisos actualizados");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.msg || "Error al actualizar permisos"),
  });

  const togglePerm = (m: string, a: string) =>
    setPerms((prev) => ({
      ...prev,
      [m]: { ...prev[m], [a]: !prev[m]?.[a] },
    }));

  const toggleAllInModule = (m: string, value: boolean) =>
    setPerms((prev) => ({
      ...prev,
      [m]: MODULE_ACTIONS[m].reduce(
        (acc, a) => ({ ...acc, [a]: value }),
        {} as Record<string, boolean>,
      ),
    }));

  if (isLoading) return <PageLoader />;

  const editTarget = employees.find((e: any) => e._id === editId);
  const permTarget = employees.find((e: any) => e._id === permId);

  return (
    <div>
      <PageHeader
        title="Empleados"
        backTo="/dashboard"
        backLabel="Volver a inicio"
        actions={
          <Button onClick={() => setCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo empleado
          </Button>
        }
      />

      <DataTable
        columns={[
          { key: "name", header: "Nombre" },
          {
            key: "email",
            header: "Email",
            className: "hidden sm:table-cell",
          },
          {
            key: "role",
            header: "Rol",
            render: (r: any) => (
              <Badge variant="outline" className="capitalize">
                {ROLE_LABELS[r.role] || r.role}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-56",
            render: (row: any) => (
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditForm({
                      name: row.name,
                      email: row.email,
                      role: row.role,
                    });
                    setEditId(row._id);
                  }}
                >
                  Editar
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  title="Editar permisos"
                  onClick={() => {
                    setPerms(row.permissions || {});
                    setPermId(row._id);
                  }}
                >
                  <Shield className="h-4 w-4" />
                </Button>

                {row._id !== currentUser?._id && row.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteId(row._id)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={employees}
        emptyMessage="No hay empleados"
      />

      {/* CREATE */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo empleado</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate(createForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña *</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={createForm.role}
                onValueChange={(v: any) =>
                  setCreateForm({ ...createForm, role: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="worker">Operario</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={
                !createForm.name.trim() ||
                !createForm.email.trim() ||
                createForm.password.length < 6 ||
                createMut.isPending
              }
            >
              {createMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Crear
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empleado</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMut.mutate({ id: editId!, payload: editForm });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v: any) =>
                    setEditForm({ ...editForm, role: v })
                  }
                  disabled={editTarget.role === "owner"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editTarget.role === "owner" && (
                      <SelectItem value="owner">Propietario</SelectItem>
                    )}
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="worker">Operario</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !editForm.name.trim() ||
                  !editForm.email.trim() ||
                  updateMut.isPending
                }
              >
                {updateMut.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Guardar cambios
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* PERMISSIONS */}
      <Dialog open={!!permId} onOpenChange={() => setPermId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Permisos de {permTarget?.name}
            </DialogTitle>
          </DialogHeader>

          {permTarget?.role === "owner" ? (
            <p className="text-sm text-muted-foreground py-4">
              El propietario tiene acceso total. No es posible modificar sus
              permisos.
            </p>
          ) : (
            <div className="space-y-4">
              {MODULES.map((m) => {
                const actions = MODULE_ACTIONS[m];
                const allEnabled = actions.every((a) => perms[m]?.[a]);
                return (
                  <div
                    key={m}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">{m}</p>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => toggleAllInModule(m, !allEnabled)}
                      >
                        {allEnabled ? "Deshabilitar todo" : "Habilitar todo"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {actions.map((a) => (
                        <label
                          key={a}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={!!perms[m]?.[a]}
                            onCheckedChange={() => togglePerm(m, a)}
                          />
                          <span className="capitalize">{a}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermId(null)}>
              Cancelar
            </Button>
            {permTarget?.role !== "owner" && (
              <Button
                onClick={() =>
                  permId && permMut.mutate({ id: permId, payload: perms })
                }
                disabled={permMut.isPending}
              >
                {permMut.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Guardar permisos
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar empleado"
        description="Esta acción no se puede deshacer."
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
