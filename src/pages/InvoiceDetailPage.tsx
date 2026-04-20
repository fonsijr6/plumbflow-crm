/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { invoicesApi, InvoicePayload, InvoiceStatus } from "@/api/invoicesApi";
import { clientsApi } from "@/api/clientsApi";
import { productsApi } from "@/api/productsApi";

import { IfPermission } from "@/components/common/IfPermission";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { LineItemsEditor, LineItem } from "@/components/common/LineItemsEditor";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  cancelled: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  paid: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ clientId: "", notes: "" });

  const from = (location.state as any)?.from;
  const clientIdState = (location.state as any)?.clientId;
  const backTo =
    from === "client" && clientIdState
      ? `/clients/${clientIdState}`
      : "/invoices";
  const backLabel =
    from === "client" ? "Volver a cliente" : "Volver a facturas";

  /* -------------------- Queries -------------------- */

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["invoices"] });
    qc.invalidateQueries({ queryKey: ["stock"] });
  };

  /* ------------------ Mutations ------------------- */

  const updateMut = useMutation({
    mutationFn: (p: Partial<InvoicePayload>) => invoicesApi.update(id!, p),
    onSuccess: () => {
      invalidate();
      setEditing(false);
      toast.success("Factura actualizada");
    },
  });

  const statusMut = useMutation({
    mutationFn: (status: InvoiceStatus) => invoicesApi.setStatus(id!, status),
    onSuccess: (_, status) => {
      invalidate();
      toast.success(
        status === "sent"
          ? "Factura emitida"
          : status === "paid"
          ? "Factura marcada como pagada"
          : status === "cancelled"
          ? "Factura cancelada"
          : "Actualizada",
      );
    },
  });

  /* -------------------- Guards -------------------- */

  if (isLoading || !invoice) return <PageLoader />;

  const isDraft = invoice.status === "draft";

  /* ----------------- Edit logic ------------------ */

  const openEdit = () => {
    setForm({
      clientId: invoice.clientId || invoice.client?._id || "",
      notes: invoice.notes || "",
    });

    setItems(
      invoice.items.map((l: any) => ({
        product: products.find((p) => p._id === l.productId) || null,
        quantity: l.quantity,
      })),
    );

    setEditing(true);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clientId || items.length === 0) return;
    if (items.some((i) => !i.product || !i.quantity)) return;

    updateMut.mutate({
      clientId: form.clientId,
      notes: form.notes,
      items: items.map((i) => {
        const { unitPrice, taxRate, unit, name, type } = i.product!;
        const total = i.quantity * unitPrice * (1 + taxRate / 100);

        return {
          productId: i.product!._id,
          name,
          productType: type,
          unit,
          unitPrice,
          taxRate,
          quantity: i.quantity,
          total,
        };
      }),
    });
  };

  /* -------------------- Render -------------------- */

  return (
    <div>
      <PageHeader
        title={`Factura #${invoice.invoiceNumber || ""}`}
        backTo={backTo}
        backLabel={backLabel}
        actions={
          <div className="flex gap-2 flex-wrap">
            {isDraft && (
              <>
                <IfPermission module="invoices" action="edit">
                  <Button
                    onClick={() => statusMut.mutate("sent")}
                    disabled={statusMut.isPending}
                  >
                    {statusMut.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Emitir
                  </Button>
                </IfPermission>

                <IfPermission module="invoices" action="edit">
                  <Button variant="outline" onClick={openEdit}>
                    Editar
                  </Button>
                </IfPermission>
              </>
            )}

            {invoice.status === "sent" && (
              <IfPermission module="invoices" action="edit">
                <Button onClick={() => statusMut.mutate("paid")}>
                  Marcar pagada
                </Button>
              </IfPermission>
            )}

            {(invoice.status === "draft" || invoice.status === "sent") && (
              <IfPermission module="invoices" action="edit">
                <Button
                  variant="destructive"
                  onClick={() => statusMut.mutate("cancelled")}
                >
                  Cancelar
                </Button>
              </IfPermission>
            )}
          </div>
        }
      />

      {/* --- Datos y conceptos (vista) --- */}
      {/* Tu tabla de conceptos y totales estaba correcta,
          puedes mantenerla tal cual. */}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar factura (borrador)</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm({ ...form, clientId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LineItemsEditor
              items={items}
              products={products}
              onChange={setItems}
            />

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                maxLength={1500}
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                !form.clientId ||
                items.length === 0 ||
                items.some((i) => !i.product) ||
                updateMut.isPending
              }
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

export default InvoiceDetailPage;
