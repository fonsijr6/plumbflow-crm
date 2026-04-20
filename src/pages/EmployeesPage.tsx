/* eslint-disable @typescript-eslint/no-explicit-any */

// Common components
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

// UI components
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons & utils
import { Plus, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

/* -------------------- Permisos -------------------- */

const MODULES = ["clients", "tasks", "invoices", "quotes", "products", "stock"];

const MODULE_ACTIONS: Record<string, string[]> = {
  clients: ["view", "create", "edit", "delete"],
  tasks: ["view", "create", "edit", "assign", "complete", "delete"],
  invoices: ["view", "create", "edit", "delete"],
  quotes: ["view", "create", "edit", "delete", "convert"],
  products: ["view", "create", "edit", "delete"],
  stock: ["view", "edit"],
};

const ALL_ACTIONS = Array.from(new Set(Object.values(MODULE_ACTIONS).flat()));

/* -------------------- Página -------------------- */

export default function EmployeesPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [permModal, setPermModal] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateEmployeePayload>({
    name: "",
    email: "",
    password: "",
    role: "worker",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "worker",
  });

  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(
    {},
  );

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: employeesApi.list,
  });

  const createMut = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setCreateModal(false);
      setForm({ name: "", email: "", password: "", role: "worker" });
      toast.success("Empleado creado");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      employeesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setEditModal(null);
      toast.success("Empleado actualizado");
    },
  });

  const deleteMut = useMutation({
    mutationFn: employeesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setDeleteId(null);
      toast.success("Empleado eliminado");
    },
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
      setPermModal(null);
      toast.success("Permisos actualizados");
    },
  });

  const togglePerm = (module: string, action: string) => {
    setPerms((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  if (isLoading) return <PageLoader />;

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
                {r.role}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "w-40",
            render: (row: any) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditForm({
                      name: row.name,
                      email: row.email,
                      role: row.role,
                    });
                    setEditModal(row._id);
                  }}
                >
                  Editar
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPerms(row.permissions || {});
                    setPermModal(row._id);
                  }}
                >
                  <Shield className="h-4 w-4" />
                </Button>

                {row._id !== currentUser?._id && (
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar empleado"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}

// React Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// API
import { employeesApi, CreateEmployeePayload } from "@/api/employeesApi";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

// Context
