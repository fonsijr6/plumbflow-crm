import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi, InvoicePayload } from "@/api/invoicesApi";
import { clientsApi } from "@/api/clientsApi";
import { productsApi } from "@/api/productsApi";
import { IfPermission } from "@/components/common/IfPermission";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { LineItemsEditor, LineItem } from "@/components/common/LineItemsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const InvoicesPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sp] = useSearchParams();
  const filterClientId = sp.get("clientId") || "";
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState<{ clientId: string; notes: string }>({ clientId: filterClientId, notes: "" });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", filterClientId],
    queryFn: () => invoicesApi.list(filterClientId ? { clientId: filterClientId } : undefined),
  });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => clientsApi.list() });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });

  const createMut = useMutation({
    mutationFn: (p: InvoicePayload) => invoicesApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setModal(false);
      setItems([]);
      toast.success("Factura creada");
    },
  });

  const filtered = invoices.filter((i) =>
    (i.client?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    String(i.number || "").includes(search)
  );

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
    paid: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };
  const statusLabel: Record<string, string> = { draft: "Borrador", sent: "Enviada", paid: "Pagada", cancelled: "Cancelada" };

  if (isLoading) return <PageLoader />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || items.length === 0 || items.some((i) => !i.productId || !i.quantity)) return;
    createMut.mutate({
      clientId: form.clientId,
      notes: form.notes,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
  };

  return (
    <div>
      <PageHeader title="Facturas" backTo="/dashboard" backLabel="Volver a inicio"
        actions={
          <IfPermission module="invoices" action="create">
            <Button onClick={() => { setForm({ clientId: filterClientId, notes: "" }); setItems([{ productId: "", quantity: 1 }]); setModal(true); }}>
              <Plus className="h-4 w-4" /> Nueva factura
            </Button>
          </IfPermission>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar factura…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={[
          { key: "number", header: "#", render: (r: any) => `#${r.number || "—"}` },
          { key: "client", header: "Cliente", render: (r: any) => r.client?.name || "—" },
          { key: "total", header: "Total", render: (r: any) => r.total?.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) },
          { key: "status", header: "Estado", render: (r: any) => <Badge className={cn("text-xs", statusColor[r.status])}>{statusLabel[r.status]}</Badge> },
          { key: "createdAt", header: "Fecha", className: "hidden md:table-cell", render: (r: any) => new Date(r.createdAt).toLocaleDateString("es-ES") },
        ]}
        data={filtered as any}
        onRowClick={(row: any) => navigate(`/invoices/${row._id}`)}
        emptyMessage="No hay facturas"
      />

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva factura</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <LineItemsEditor items={items} products={products} onChange={setItems} />

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea maxLength={1500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <Button type="submit" className="w-full"
              disabled={!form.clientId || items.length === 0 || items.some((i) => !i.productId || !i.quantity) || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear factura (borrador)
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
