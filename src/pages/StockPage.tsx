import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi, StockPayload } from "@/api/stockApi";
import { productsApi } from "@/api/productsApi";
import { IfPermission } from "@/components/common/IfPermission";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const emptyForm: StockPayload = { productId: "", quantity: 0, location: "", notes: "" };

const StockPage = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [form, setForm] = useState<StockPayload>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: stockItems = [], isLoading } = useQuery({ queryKey: ["stock"], queryFn: () => stockApi.list() });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });

  const createMut = useMutation({
    mutationFn: (p: StockPayload) => stockApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock"] }); setModal(false); setForm(emptyForm); toast.success("Stock creado"); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Partial<StockPayload> }) => stockApi.update(id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock"] }); setEditModal(null); toast.success("Stock actualizado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => stockApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock"] }); setDeleteId(null); toast.success("Stock eliminado"); },
  });

  const filtered = stockItems.filter((s) =>
    (s.product?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.location || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoader />;

  const openEdit = (item: typeof stockItems[0]) => {
    setForm({ productId: item.productId || item.product?._id || "", quantity: item.quantity, location: item.location || "", notes: item.notes || "" });
    setEditModal(item._id);
  };

  const formFields = (
    <>
      <div className="space-y-2">
        <Label>Producto *</Label>
        <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
          <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
          <SelectContent>{products.map((p) => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Cantidad *</Label><Input type="number" min={0} max={1000000} placeholder="0" value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></div>
      <div className="space-y-2"><Label>Ubicación</Label><Input maxLength={150} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
      <div className="space-y-2"><Label>Notas</Label><Textarea maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    </>
  );

  return (
    <div>
      <PageHeader title="Stock" backTo="/dashboard" backLabel="Volver a inicio"
        actions={
          <IfPermission module="products" action="create">
            <Button onClick={() => { setForm(emptyForm); setModal(true); }}><Plus className="h-4 w-4" /> Nuevo stock</Button>
          </IfPermission>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar stock…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={[
          { key: "product", header: "Producto", render: (r: any) => r.product?.name || "—" },
          { key: "quantity", header: "Cantidad", render: (r: any) => (r.quantity as number)?.toLocaleString("es-ES") },
          { key: "location", header: "Ubicación", className: "hidden sm:table-cell" },
          {
            key: "actions", header: "", className: "w-32",
            render: (row: any) => (
              <div className="flex gap-1">
                <IfPermission module="products" action="edit">
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(row); }}>Editar</Button>
                </IfPermission>
                <IfPermission module="products" action="delete">
                  <Button variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(row._id); }}>Eliminar</Button>
                </IfPermission>
              </div>
            ),
          },
        ]}
        data={filtered as any}
        emptyMessage="No hay stock registrado"
      />

      {/* Create */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo stock</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            {formFields}
            <Button type="submit" className="w-full" disabled={!form.productId || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar stock</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editModal && updateMut.mutate({ id: editModal, p: form }); }} className="space-y-4">
            {formFields}
            <Button type="submit" className="w-full" disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Eliminar stock" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
};

export default StockPage;
