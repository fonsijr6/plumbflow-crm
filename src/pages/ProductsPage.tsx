import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const UNITS = ["unidad", "kg", "m", "litro", "hora"];

const emptyProduct: ProductPayload = {
  name: "", type: "material", category: "", unit: "unidad",
  unitPrice: 0, taxRate: 21, initialStock: 0, description: "",
};

const ProductsPage = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<ProductPayload>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [localCategories, setLocalCategories] = useState<string[]>([]);

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });

  const categories = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean) as string[];
    return [...new Set([...fromProducts, ...localCategories])].sort((a, b) => a.localeCompare(b));
  }, [products, localCategories]);

  const createMut = useMutation({
    mutationFn: (p: ProductPayload) => productsApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      setModal(false);
      setForm(emptyProduct);
      toast.success("Producto creado");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleteId(null); toast.success("Producto eliminado"); },
  });

  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) { toast.error("La categoría ya existe"); return; }
    setLocalCategories((p) => [...p, trimmed]);
    setForm({ ...form, category: trimmed });
    setNewCatName("");
    setCatModal(false);
    toast.success("Categoría creada");
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Productos" backTo="/dashboard" backLabel="Volver a inicio"
        actions={
          <IfPermission module="products" action="create">
            <Button onClick={() => { setForm(emptyProduct); setModal(true); }}><Plus className="h-4 w-4" /> Nuevo producto</Button>
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
          { key: "type", header: "Tipo", render: (r: any) => (
            <Badge variant={r.type === "material" ? "default" : "secondary"} className="text-xs">
              {r.type === "material" ? "Material" : "Servicio"}
            </Badge>
          ) },
          { key: "category", header: "Categoría", className: "hidden sm:table-cell", render: (r: any) => r.category || "—" },
          { key: "unit", header: "Unidad", className: "hidden sm:table-cell", render: (r: any) => r.unit || "—" },
          { key: "unitPrice", header: "Precio", render: (r: any) => (r.unitPrice as number)?.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) },
          { key: "taxRate", header: "IVA", className: "hidden md:table-cell", render: (r: any) => r.taxRate != null ? `${r.taxRate}%` : "—" },
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v: "material" | "service") => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">Material (gestiona stock)</SelectItem>
                  <SelectItem value="service">Servicio (sin stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <div className="flex gap-2">
                <Select value={form.category || "__none__"} onValueChange={(v) => setForm({ ...form, category: v === "__none__" ? "" : v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin categoría</SelectItem>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setCatModal(true)} title="Nueva categoría">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={form.unit || "unidad"} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio unitario *</Label>
                <Input type="number" min={0} max={1000000} step="0.01" placeholder="0,00"
                  value={form.unitPrice || ""} onChange={(e) => setForm({ ...form, unitPrice: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>IVA %</Label>
                <Input type="number" min={0} max={100} step="0.01" placeholder="21"
                  value={form.taxRate ?? ""} onChange={(e) => setForm({ ...form, taxRate: +e.target.value })} />
              </div>
            </div>

            {form.type === "material" && (
              <div className="space-y-2">
                <Label>Stock inicial</Label>
                <Input type="number" min={0} max={1000000} placeholder="0"
                  value={form.initialStock || ""} onChange={(e) => setForm({ ...form, initialStock: +e.target.value })} />
                <p className="text-xs text-muted-foreground">El stock se creará automáticamente al guardar.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input maxLength={150} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <Button type="submit" className="w-full" disabled={!form.name.trim() || !form.unitPrice || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear producto
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={catModal} onOpenChange={setCatModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateCategory(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la categoría *</Label>
              <Input maxLength={150} value={newCatName} onChange={(e) => setNewCatName(e.target.value)} autoFocus />
            </div>
            <Button type="submit" className="w-full" disabled={!newCatName.trim()}>Crear categoría</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Eliminar producto" onConfirm={() => deleteId && deleteMut.mutate(deleteId)} loading={deleteMut.isPending} />
    </div>
  );
};

export default ProductsPage;
