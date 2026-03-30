import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi, QuotePayload, QuoteLine } from "@/api/quotesApi";
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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emptyLine: QuoteLine = { description: "", quantity: 1, price: 0, iva: 21 };

const QuotesPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<QuotePayload>({ clientId: "", lines: [{ ...emptyLine }], notes: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: quotes = [], isLoading } = useQuery({ queryKey: ["quotes"], queryFn: () => quotesApi.list() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => clientsApi.list() });

  const createMut = useMutation({
    mutationFn: (p: QuotePayload) => quotesApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotes"] }); setModal(false); toast.success("Presupuesto creado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => quotesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotes"] }); setDeleteId(null); toast.success("Presupuesto eliminado"); },
  });

  const filtered = quotes.filter((q) =>
    (q.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    String(q.number || "").includes(search)
  );

  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });
  const removeLine = (idx: number) => setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  const updateLine = (idx: number, field: keyof QuoteLine, value: string | number) => {
    const lines = [...form.lines];
    lines[idx] = { ...lines[idx], [field]: value };
    setForm({ ...form, lines });
  };

  const statusColor: Record<string, string> = { pending: "bg-warning/10 text-warning", accepted: "bg-success/10 text-success", rejected: "bg-destructive/10 text-destructive" };
  const statusLabel: Record<string, string> = { pending: "Pendiente", accepted: "Aceptado", rejected: "Rechazado" };

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Presupuestos" backTo="/dashboard" backLabel="Volver a inicio"
        actions={
          <IfPermission module="quotes" action="create">
            <Button onClick={() => { setForm({ clientId: "", lines: [{ ...emptyLine }], notes: "" }); setModal(true); }}>
              <Plus className="h-4 w-4" /> Nuevo presupuesto
            </Button>
          </IfPermission>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar presupuesto…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={[
          { key: "number", header: "#", render: (r: any) => `#${r.number || "—"}` },
          { key: "client", header: "Cliente", render: (r: any) => r.client?.name || "—" },
          { key: "total", header: "Total", render: (r: any) => r.total?.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) },
          { key: "status", header: "Estado", render: (r: any) => <Badge className={cn("text-xs", statusColor[r.status])}>{statusLabel[r.status]}</Badge> },
          {
            key: "actions", header: "", className: "w-10",
            render: (row: any) => (
              <IfPermission module="quotes" action="delete">
                <Button variant="ghost" size="sm" className="text-destructive h-8 px-2"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(row._id); }}>
                  Eliminar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filtered as any}
        onRowClick={(row: any) => navigate(`/quotes/${row._id}`)}
        emptyMessage="No hay presupuestos"
      />

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo presupuesto</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><Label>Conceptos</Label><Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3" /> Línea</Button></div>
              {form.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-4 space-y-1"><Label className="text-xs">Descripción</Label><Input maxLength={150} value={line.description} onChange={(e) => updateLine(idx, "description", e.target.value)} /></div>
                  <div className="col-span-4 sm:col-span-2 space-y-1"><Label className="text-xs">Cantidad</Label><Input type="number" min={0} max={10000} value={line.quantity || ""} onChange={(e) => updateLine(idx, "quantity", +e.target.value)} /></div>
                  <div className="col-span-4 sm:col-span-2 space-y-1"><Label className="text-xs">Precio</Label><Input type="number" min={0} max={1000000} step="0.01" value={line.price || ""} onChange={(e) => updateLine(idx, "price", +e.target.value)} /></div>
                  <div className="col-span-3 sm:col-span-2 space-y-1"><Label className="text-xs">IVA %</Label><Input type="number" min={0} max={100} value={line.iva || ""} onChange={(e) => updateLine(idx, "iva", +e.target.value)} /></div>
                  <div className="col-span-1 sm:col-span-2 flex justify-end">{form.lines.length > 1 && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2"><Label>Notas</Label><Textarea maxLength={1500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={!form.clientId || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear presupuesto
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Eliminar presupuesto" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
};

export default QuotesPage;
