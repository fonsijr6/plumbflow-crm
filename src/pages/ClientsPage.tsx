/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { clientsApi, ClientPayload } from "@/api/clientsApi";
import { IfPermission } from "@/components/common/IfPermission";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

/* -------------------- Constantes -------------------- */

const emptyClient: ClientPayload = {
  name: "",
  email: "",
  phone: "",
  address: "",
  nif: "",
  notes: "",
};

/* -------------------- Página -------------------- */

const ClientsPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ClientPayload>(emptyClient);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* -------------------- Queries -------------------- */

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
  });

  /* -------------------- Mutations -------------------- */

  const createMut = useMutation({
    mutationFn: (payload: ClientPayload) => clientsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setModalOpen(false);
      setForm(emptyClient);
      toast.success("Cliente creado");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      setDeleteId(null);
      toast.success("Cliente eliminado");
    },
  });

  /* -------------------- Helpers -------------------- */

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [clients, search],
  );

  const isFormValid = form.name.trim().length > 0;

  if (isLoading) return <PageLoader />;

  /* -------------------- Render -------------------- */

  return (
    <div>
      <PageHeader
        title="Clientes"
        backTo="/dashboard"
        backLabel="Volver a inicio"
        actions={
          <IfPermission module="clients" action="create">
            <Button
              onClick={() => {
                setForm(emptyClient);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo cliente
            </Button>
          </IfPermission>
        }
      />

      {/* Buscador */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <DataTable
        columns={[
          { key: "name", header: "Nombre" },
          {
            key: "email",
            header: "Email",
            className: "hidden sm:table-cell",
          },
          {
            key: "phone",
            header: "Teléfono",
            className: "hidden md:table-cell",
          },
          {
            key: "actions",
            header: "",
            className: "w-10",
            render: (row: any) => (
              <IfPermission module="clients" action="delete">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-8 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(row._id);
                  }}
                >
                  Eliminar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filteredClients}
        onRowClick={(row: any) => navigate(`/clients/${row._id}`)}
        emptyMessage="No hay clientes"
      />

      {/* Modal crear */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                maxLength={150}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                maxLength={150}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>NIF / CIF</Label>
              <Input
                maxLength={20}
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                maxLength={500}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || createMut.isPending}
            >
              {createMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Crear cliente
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar cliente"
        description="¿Seguro que quieres eliminar este cliente?"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
};

export default ClientsPage;
