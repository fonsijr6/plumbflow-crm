import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, ProductPayload } from "@/api/productsApi";
import { IfPermission } from "@/components/common/IfPermission";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const emptyProduct: ProductPayload = { name: "", category: "", unit: "", price: 0, stock: 0, description: "" };

const ProductsPage = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<ProductPayload>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });

  const createMut = useMutation({
    mutationFn: (p: ProductPayload) => productsApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setModal(false); setForm(emptyProduct); toast.success("Producto creado"); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleteId(null); toast.success("Producto eliminado"); },
  });

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Productos" backTo="/dashboard" backLabel="Volver a inicio"
        actions={
          <IfPermission module="products" action="create">
            <Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Nuevo producto</Button>
          </IfPermission>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar producto…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Nombre" },
          { key: "category", header: "Categoría", className: "hidden sm:table-cell" },
          { key: "price", header: "Precio", render: (r: any) => (r.price as number)?.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) },
          { key: "stock", header: "Stock", render: (r: any) => (r.stock as number)?.toLocaleString("es-ES") },
          {
            key: "actions", header: "", className: "w-10",
            render: (row: any) => (
              <IfPermission module="products" action="delete">
                <Button variant="ghost" size="sm" className="text-destructive h-8 px-2"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(row._id as string); }}>
                  Eliminar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filtered as any}
        emptyMessage="No hay productos"
      />

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Categoría</Label><Input maxLength={150} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="space-y-2"><Label>Unidad</Label><Input maxLength={150} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Precio</Label><Input type="number" min={0} max={1000000} step="0.01" placeholder="0" value={form.price || ""} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
              <div className="space-y-2"><Label>Stock</Label><Input type="number" min={0} max={1000000} placeholder="0" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={!form.name.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear producto
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Eliminar producto" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
};

export default ProductsPage;
