import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { clientsApi, ClientPayload } from "@/api/clientsApi";
import { tasksApi } from "@/api/tasksApi";
import { invoicesApi } from "@/api/invoicesApi";

import { IfPermission } from "@/components/common/IfPermission";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";

/* -------------------- Página -------------------- */

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ClientPayload>({
    name: "",
    email: "",
    phone: "",
    address: "",
    nif: "",
    notes: "",
  });

  /* -------------------- Queries -------------------- */

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientsApi.get(id!),
    enabled: !!id,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", { clientId: id }],
    queryFn: () => tasksApi.list({ clientId: id! }),
    enabled: !!id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", { clientId: id }],
    queryFn: () => invoicesApi.list({ clientId: id! }),
    enabled: !!id,
  });

  /* -------------------- Mutations -------------------- */

  const updateMut = useMutation({
    mutationFn: (payload: Partial<ClientPayload>) =>
      clientsApi.update(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", id] });
      setEditing(false);
      toast.success("Cliente actualizado");
    },
  });

  if (isLoading || !client) return <PageLoader />;

  /* -------------------- Helpers -------------------- */

  const openEdit = () => {
    setForm({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      nif: client.nif || "",
      notes: client.notes || "",
    });
    setEditing(true);
  };

  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    in_progress: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completado",
  };

  /* -------------------- Render -------------------- */

  return (
    <div>
      <PageHeader
        title={client.name}
        backTo="/clients"
        backLabel="Volver a clientes"
        actions={
          <IfPermission module="clients" action="edit">
            <Button variant="outline" onClick={openEdit}>
              Editar
            </Button>
          </IfPermission>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {client.email && (
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-1">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="ml-1">{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div>
                <span className="text-muted-foreground">Dirección:</span>
                <span className="ml-1">{client.address}</span>
              </div>
            )}
            {client.nif && (
              <div>
                <span className="text-muted-foreground">NIF / CIF:</span>
                <span className="ml-1">{client.nif}</span>
              </div>
            )}
            {client.notes && (
              <div>
                <span className="text-muted-foreground">Notas:</span>
                <span className="ml-1">{client.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avisos y facturas */}
        <div className="space-y-6">
          {/* Avisos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Avisos ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin avisos</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((t) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between rounded-lg border border-border p-2 cursor-pointer hover:bg-muted/30"
                      onClick={() => navigate(`/tasks/${t._id}`)}
                    >
                      <span className="text-sm truncate">{t.title}</span>
                      <Badge className={cn("text-xs", statusColor[t.status])}>
                        {statusLabel[t.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facturas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Facturas ({invoices.length})
              </CardTitle>
              <button
                onClick={() => navigate(`/invoices?clientId=${id}`)}
                className="text-sm text-primary hover:underline"
              >
                Ver todas
              </button>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin facturas</p>
              ) : (
                <div className="space-y-2">
                  {invoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between rounded-lg border border-border p-2 cursor-pointer hover:bg-muted/30"
                      onClick={() =>
                        navigate(`/invoices/${inv._id}`, {
                          state: { from: "client", clientId: id },
                        })
                      }
                    >
                      <span className="text-sm">
                        Factura #{inv.invoiceNumber}
                      </span>
                      <span className="text-sm font-medium">
                        {inv.total.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal editar */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMut.mutate(form);
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
              disabled={!form.name.trim() || updateMut.isPending}
            >
              {updateMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Guardar cambios
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;
