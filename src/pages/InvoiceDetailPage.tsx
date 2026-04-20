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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState<{ clientId: string; notes: string }>({ clientId: "", notes: "" });

  const from = (location.state as any)?.from;
  const clientIdState = (location.state as any)?.clientId;
  const backTo = from === "client" && clientIdState ? `/clients/${clientIdState}` : "/invoices";
  const backLabel = from === "client" ? "Volver a cliente" : "Volver a facturas";

  const { data: invoice, isLoading } = useQuery({ queryKey: ["invoice", id], queryFn: () => invoicesApi.get(id!), enabled: !!id });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => clientsApi.list() });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["invoices"] });
    qc.invalidateQueries({ queryKey: ["stock"] });
  };

  const updateMut = useMutation({
    mutationFn: (p: Partial<InvoicePayload>) => invoicesApi.update(id!, p),
    onSuccess: () => { invalidate(); setEditing(false); toast.success("Factura actualizada"); },
  });

  const statusMut = useMutation({
    mutationFn: (status: InvoiceStatus) => invoicesApi.setStatus(id!, status),
    onSuccess: (_, status) => {
      invalidate();
      toast.success(
        status === "sent" ? "Factura emitida" :
        status === "paid" ? "Factura marcada como pagada" :
        status === "cancelled" ? "Factura cancelada" : "Actualizada"
      );
    },
  });

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
    paid: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };
  const statusLabel: Record<string, string> = { draft: "Borrador", sent: "Enviada", paid: "Pagada", cancelled: "Cancelada" };

  if (isLoading || !invoice) return <PageLoader />;

  const lines = invoice.items || invoice.lines || [];
  const isDraft = invoice.status === "draft";

  const openEdit = () => {
    setForm({ clientId: invoice.clientId || invoice.client?._id || "", notes: invoice.notes || "" });
    setItems(lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      name: l.name,
      unit: l.unit,
      unitPrice: l.unitPrice,
      taxRate: l.taxRate,
      productType: l.productType,
    })));
    setEditing(true);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({
      clientId: form.clientId,
      notes: form.notes,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
  };

  return (
    <div>
      <PageHeader title={`Factura #${invoice.number || ""}`} backTo={backTo} backLabel={backLabel}
        actions={
          <div className="flex gap-2 flex-wrap">
            {isDraft && (
              <>
                <IfPermission module="invoices" action="edit">
                  <Button onClick={() => statusMut.mutate("sent")} disabled={statusMut.isPending}>
                    {statusMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Emitir
                  </Button>
                </IfPermission>
                <IfPermission module="invoices" action="edit">
                  <Button variant="outline" onClick={openEdit}>Editar</Button>
                </IfPermission>
              </>
            )}
            {invoice.status === "sent" && (
              <IfPermission module="invoices" action="edit">
                <Button onClick={() => statusMut.mutate("paid")} disabled={statusMut.isPending}>
                  Marcar pagada
                </Button>
              </IfPermission>
            )}
            {(invoice.status === "draft" || invoice.status === "sent") && (
              <IfPermission module="invoices" action="edit">
                <Button variant="destructive" onClick={() => statusMut.mutate("cancelled")} disabled={statusMut.isPending}>
                  Cancelar
                </Button>
              </IfPermission>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Datos</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Estado:</span> <Badge className={cn("ml-1 text-xs", statusColor[invoice.status])}>{statusLabel[invoice.status]}</Badge></div>
            {invoice.client && <div><span className="text-muted-foreground">Cliente:</span> <button onClick={() => navigate(`/clients/${invoice.client!._id}`)} className="ml-1 text-primary hover:underline">{invoice.client.name}</button></div>}
            <div><span className="text-muted-foreground">Fecha:</span> <span className="ml-1">{new Date(invoice.createdAt).toLocaleDateString("es-ES")}</span></div>
            {invoice.notes && <div><span className="text-muted-foreground">Notas:</span> <span className="ml-1">{invoice.notes}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conceptos</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2">Concepto</th><th className="pb-2">Cant.</th><th className="pb-2">Precio</th><th className="pb-2">IVA</th><th className="pb-2 text-right">Total</th></tr></thead>
                <tbody>
                  {lines.map((l, i) => {
                    const lt = (l.quantity || 0) * (l.unitPrice ?? 0) * (1 + (l.taxRate ?? 0) / 100);
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{l.name || "—"}{l.productType === "service" && <span className="text-xs text-muted-foreground ml-1">(srv)</span>}</td>
                        <td className="py-2">{l.quantity}{l.unit ? ` ${l.unit}` : ""}</td>
                        <td className="py-2">{(l.unitPrice ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                        <td className="py-2">{l.taxRate ?? 0}%</td>
                        <td className="py-2 text-right">{lt.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 text-right text-sm">
              <p><span className="text-muted-foreground">Subtotal:</span> {invoice.subtotal?.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
              <p><span className="text-muted-foreground">Impuestos:</span> {invoice.taxTotal?.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
              <p className="text-lg font-bold">{invoice.total?.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar factura (borrador)</DialogTitle></DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <LineItemsEditor items={items} products={products} onChange={setItems} />
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea maxLength={1500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button type="submit" className="w-full"
              disabled={!form.clientId || items.length === 0 || items.some((i) => !i.productId || !i.quantity) || updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceDetailPage;
