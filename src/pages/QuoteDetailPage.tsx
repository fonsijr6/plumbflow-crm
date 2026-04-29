/* eslint-disable @typescript-eslint/no-explicit-any */

/* -------------------- Estados -------------------- */

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  accepted: "Aceptado",
  rejected: "Rechazado",
  converted: "Convertido",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  converted: "bg-primary/10 text-primary",
};

const QuoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ clientId: "", notes: "" });

  /* -------------------- Queries -------------------- */

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote", id],
    queryFn: () => quotesApi.get(id!),
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
    qc.invalidateQueries({ queryKey: ["quote", id] });
    qc.invalidateQueries({ queryKey: ["quotes"] });
  };

  /* -------------------- Mutations -------------------- */

  const updateMut = useMutation({
    mutationFn: (p: Partial<QuotePayload>) => quotesApi.update(id!, p),
    onSuccess: () => {
      invalidate();
      setEditing(false);
      toast.success("Presupuesto actualizado");
    },
  });

  const statusMut = useMutation({
    mutationFn: (status: QuoteStatus) => quotesApi.setStatus(id!, status),
    onSuccess: () => {
      invalidate();
      toast.success("Estado actualizado");
    },
  });

  const convertMut = useMutation({
    mutationFn: () => quotesApi.convert(id!),
    onSuccess: (data) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Presupuesto convertido a factura");
      if (data?.invoiceId) {
        navigate(`/invoices/${data.invoiceId}`);
      }
    },
  });

  /* -------------------- Guards -------------------- */

  if (isLoading || !quote) return <PageLoader />;

  const isDraft = quote.status === "draft";
  const isAccepted = quote.status === "accepted";

  /* -------------------- Edit -------------------- */

  const openEdit = () => {
    setForm({
      clientId: quote.clientId || quote.client?._id || "",
      notes: quote.notes || "",
    });

    setItems(
      quote.items.map((l: any) => ({
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
        const { price, taxRate, unit, name, type } = i.product!;
        const total = i.quantity * price * (1 + taxRate / 100);

        return {
          productId: i.product!._id,
          name,
          productType: type,
          unit,
          price,
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
        title={`Presupuesto #${quote.quoteNumber}`}
        backTo="/quotes"
        backLabel="Volver a presupuestos"
        actions={
          <div className="flex gap-2 flex-wrap">
            {isDraft && (
              <>
                <IfPermission module="quotes" action="edit">
                  <Button
                    className="bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => statusMut.mutate("accepted")}
                  >
                    Aceptar
                  </Button>
                </IfPermission>

                <IfPermission module="quotes" action="edit">
                  <Button
                    variant="destructive"
                    onClick={() => statusMut.mutate("rejected")}
                  >
                    Rechazar
                  </Button>
                </IfPermission>

                <IfPermission module="quotes" action="edit">
                  <Button variant="outline" onClick={openEdit}>
                    Editar
                  </Button>
                </IfPermission>
              </>
            )}

            {isAccepted && (
              <IfPermission module="quotes" action="convert">
                <Button onClick={() => convertMut.mutate()}>
                  {convertMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Convertir a factura
                </Button>
              </IfPermission>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos */}
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <Badge className={cn("ml-1 text-xs", STATUS_COLOR[quote.status])}>
                {STATUS_LABEL[quote.status]}
              </Badge>
            </div>

            {quote.client && (
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <button
                  onClick={() => navigate(`/clients/${quote.client._id}`)}
                  className="ml-1 text-primary hover:underline"
                >
                  {quote.client.name}
                </button>
              </div>
            )}

            {quote.notes && (
              <div>
                <span className="text-muted-foreground">Notas:</span>
                <span className="ml-1">{quote.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conceptos */}
        <Card>
          <CardHeader>
            <CardTitle>Conceptos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Concepto</th>
                    <th className="pb-2">Cant.</th>
                    <th className="pb-2">Precio</th>
                    <th className="pb-2">IVA</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((l: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">
                        {l.name}
                        {l.productType === "service" && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (srv)
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        {l.quantity}
                        {l.unit ? ` ${l.unit}` : ""}
                      </td>
                      <td className="py-2">
                        {l.price.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="py-2">{l.taxRate}%</td>
                      <td className="py-2 text-right">
                        {l.total.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-1 text-right text-sm">
              <p>
                <span className="text-muted-foreground">Subtotal:</span>{" "}
                {quote.subtotal.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
              <p>
                <span className="text-muted-foreground">Impuestos:</span>{" "}
                {quote.taxTotal.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
              <p className="text-lg font-bold">
                {quote.total.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal editar */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar presupuesto (borrador)</DialogTitle>
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

export default QuoteDetailPage;
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { quotesApi, QuotePayload, QuoteStatus } from "@/api/quotesApi";
import { clientsApi } from "@/api/clientsApi";
import { productsApi, Product } from "@/api/productsApi";

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
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
