import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi, QuotePayload, QuoteLine } from "@/api/quotesApi";
import { clientsApi } from "@/api/clientsApi";
import { IfPermission } from "@/components/common/IfPermission";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const QuoteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<QuotePayload>({ clientId: "", lines: [], notes: "" });

  const { data: quote, isLoading } = useQuery({ queryKey: ["quote", id], queryFn: () => quotesApi.get(id!), enabled: !!id });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => clientsApi.list() });

  const updateMut = useMutation({
    mutationFn: (p: Partial<QuotePayload>) => quotesApi.update(id!, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quote", id] }); qc.invalidateQueries({ queryKey: ["quotes"] }); setEditing(false); toast.success("Presupuesto actualizado"); },
  });

  const emptyLine: QuoteLine = { description: "", quantity: 1, price: 0, iva: 21 };
  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });
  const removeLine = (idx: number) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx: number, field: keyof QuoteLine, value: string | number) => {
    const lines = [...form.lines];
    lines[idx] = { ...lines[idx], [field]: value };
    setForm({ ...form, lines });
  };

  const statusColor: Record<string, string> = { pending: "bg-warning/10 text-warning", accepted: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive" };
  const statusLabel: Record<string, string> = { pending: "Pendiente", accepted: "Aceptado", rejected: "Rechazado" };

  if (isLoading || !quote) return <PageLoader />;

  const openEdit = () => {
    setForm({ clientId: quote.clientId || quote.client?._id || "", lines: [...quote.lines], notes: quote.notes || "" });
    setEditing(true);
  };

  return (
    <div>
      <PageHeader title={`Presupuesto #${quote.number || ""}`} backTo="/quotes" backLabel="Volver a presupuestos"
        actions={
          <div className="flex gap-2">
            {quote.status === "pending" && (
              <>
                <IfPermission module="quotes" action="edit">
                  <Button onClick={() => updateMut.mutate({ status: "accepted" })} disabled={updateMut.isPending} className="bg-success hover:bg-success/90 text-success-foreground">Aceptar</Button>
                </IfPermission>
                <IfPermission module="quotes" action="edit">
                  <Button variant="destructive" onClick={() => updateMut.mutate({ status: "rejected" })} disabled={updateMut.isPending}>Rechazar</Button>
                </IfPermission>
                <IfPermission module="quotes" action="edit">
                  <Button variant="outline" onClick={openEdit}>Editar</Button>
                </IfPermission>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Datos</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">Estado:</span> <Badge className={cn("ml-1 text-xs", statusColor[quote.status])}>{statusLabel[quote.status]}</Badge></div>
            {quote.client && <div><span className="text-muted-foreground">Cliente:</span> <button onClick={() => navigate(`/clients/${quote.client!._id}`)} className="ml-1 text-primary hover:underline">{quote.client.name}</button></div>}
            {quote.notes && <div><span className="text-muted-foreground">Notas:</span> <span className="ml-1">{quote.notes}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conceptos</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-2">Descripción</th><th className="pb-2">Cant.</th><th className="pb-2">Precio</th><th className="pb-2">IVA</th><th className="pb-2 text-right">Total</th></tr></thead>
                <tbody>
                  {quote.lines.map((l, i) => {
                    const lineTotal = l.quantity * l.price * (1 + l.iva / 100);
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{l.description}</td><td className="py-2">{l.quantity}</td>
                        <td className="py-2">{l.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                        <td className="py-2">{l.iva}%</td>
                        <td className="py-2 text-right">{lineTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 text-right text-sm">
              <p><span className="text-muted-foreground">Subtotal:</span> {quote.subtotal?.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
              <p><span className="text-muted-foreground">Impuestos:</span> {quote.taxTotal?.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
              <p className="text-lg font-bold">{quote.total?.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar presupuesto</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>Conceptos</Label><Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3" /> Línea</Button></div>
              {form.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-4 space-y-1"><Label className="text-xs">Descripción</Label><Input maxLength={150} value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)} /></div>
                  <div className="col-span-4 sm:col-span-2 space-y-1"><Label className="text-xs">Cant.</Label><Input type="number" min={0} max={10000} value={line.quantity || ""} onChange={(e) => updateLine(idx, "quantity", +e.target.value)} /></div>
                  <div className="col-span-4 sm:col-span-2 space-y-1"><Label className="text-xs">Precio</Label><Input type="number" min={0} max={1000000} step="0.01" value={line.price || ""} onChange={(e) => updateLine(idx, "price", +e.target.value)} /></div>
                  <div className="col-span-3 sm:col-span-2 space-y-1"><Label className="text-xs">IVA %</Label><Input type="number" min={0} max={100} value={line.iva || ""} onChange={(e) => updateLine(idx, "iva", +e.target.value)} /></div>
                  <div className="col-span-1 sm:col-span-2">{form.lines.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2"><Label>Notas</Label><Textarea maxLength={1500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteDetailPage;
