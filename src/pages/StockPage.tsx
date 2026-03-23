import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { StockItem } from "@/data/mockData";
import { Search, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const emptyStock = (): Omit<StockItem, "id"> => ({
  nombre: "", categoria: "", cantidad: 0, unidad: "uds", precioUnitario: 0, stockMinimo: 1,
});

const StockPage = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [form, setForm] = useState<Omit<StockItem, "id">>(emptyStock());
  const { stock, addStockItem, updateStockItem, deleteStockItem } = useData();

  const filtered = stock.filter(
    (s) =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const categorias = [...new Set(filtered.map((s) => s.categoria))];

  const openNew = () => { setEditing(null); setForm(emptyStock()); setDialogOpen(true); };
  const openEdit = (item: StockItem) => {
    setEditing(item);
    const { id, ...rest } = item;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!form.categoria.trim()) { toast.error("La categoría es obligatoria"); return; }
    if (editing) {
      updateStockItem({ ...form, id: editing.id });
      toast.success("Material actualizado");
    } else {
      addStockItem(form);
      toast.success("Material añadido");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteStockItem(id);
    toast.success("Material eliminado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
          <p className="text-sm text-muted-foreground mt-1">{stock.length} productos registrados</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nuevo material
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar producto o categoría..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {categorias.map((cat) => (
        <div key={cat} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{cat}</h2>
          {filtered
            .filter((s) => s.categoria === cat)
            .map((item) => {
              const lowStock = item.cantidad <= item.stockMinimo;
              return (
                <Card key={item.id} className="border shadow-sm group">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.nombre}</p>
                        {lowStock && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Stock bajo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.precioUnitario.toFixed(2)} € / {item.unidad}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-semibold">{item.cantidad}</p>
                        <p className="text-xs text-muted-foreground">{item.unidad}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No se encontraron productos</p>
      )}

      {/* Dialog nuevo/editar material */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar material" : "Nuevo material"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Categoría *</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Unidad</Label><Input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Cantidad</Label><Input type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Precio (€)</Label><Input type="number" step="0.01" value={form.precioUnitario} onChange={(e) => setForm({ ...form, precioUnitario: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Stock mín.</Label><Input type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockPage;
