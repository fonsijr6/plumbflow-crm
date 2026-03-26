import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StockItem } from "@/data/mockData";
import { Search, AlertTriangle, Plus, Pencil, Trash2, Loader2, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStock,
  createStockItem,
  updateStockItem,
  deleteStockItem,
} from "@/api/StockApi";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { validateStockForm, formatNumber, formatCurrency } from "@/lib/validators";

const emptyStock = (): Omit<StockItem, "id"> => ({
  name: "",
  category: "",
  quantity: 0,
  unit: "",
  unitPrice: 0,
  minStock: 1,
});

const StockPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [form, setForm] = useState<Omit<StockItem, "id">>(emptyStock());
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewUnit, setIsNewUnit] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: getStock,
  });

  const createMutation = useMutation({
    mutationFn: createStockItem,
    onSuccess: () => {
      toast.success("Material añadido");
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setDialogOpen(false);
      setFieldErrors({});
    },
    onError: () => toast.error("Error al crear el material"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<StockItem> }) =>
      updateStockItem(id, payload),
    onSuccess: () => {
      toast.success("Material actualizado");
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setDialogOpen(false);
      setFieldErrors({});
    },
    onError: () => toast.error("Error al actualizar el material"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStockItem,
    onSuccess: () => {
      toast.success("Material eliminado");
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: () => toast.error("Error al eliminar material"),
  });

  const filtered =
    stock?.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const allCategories = [...new Set(stock?.map((s) => s.category) || [])].sort();
  const allUnits = [...new Set(stock?.map((s) => s.unit) || [])].filter(Boolean).sort();

  const openNew = () => {
    setEditing(null);
    setForm(emptyStock());
    setIsNewCategory(false);
    setIsNewUnit(false);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setEditing(item);
    const { id, ...rest } = item;
    setForm(rest);
    setIsNewCategory(!allCategories.includes(item.category));
    setIsNewUnit(!allUnits.includes(item.unit));
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleNumericChange = (field: "quantity" | "unitPrice" | "minStock", value: string) => {
    const num = Number(value);
    if (num < 0) return; // prevent negatives
    setForm({ ...form, [field]: num });
  };

  const handleSave = () => {
    const errors = validateStockForm(form);
    if (errors.length) {
      const map: Record<string, string> = {};
      errors.forEach((e) => (map[e.field] = e.message));
      setFieldErrors(map);
      toast.error(errors[0].message);
      return;
    }
    setFieldErrors({});

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* STICKY HEADER */}
      <div className="shrink-0 space-y-4 pb-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Home className="h-4 w-4" /> Volver a inicio
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stock?.length ?? 0} materiales registrados
            </p>
          </div>
          <Button onClick={openNew} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Nuevo material
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar material o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* SCROLLABLE LIST */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-4 pb-4">
          {allCategories.map((cat) => {
            const catItems = filtered.filter((s) => s.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {cat}
                </h2>
                {catItems.map((item) => {
                  const lowStock = item.quantity <= item.minStock;
                  return (
                    <Card key={item.id} className="border shadow-sm group">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{item.name}</p>
                            {lowStock && (
                              <Badge
                                variant="outline"
                                className="bg-destructive/10 text-destructive border-destructive/30 text-xs"
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" /> Stock bajo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)} / {item.unit}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-semibold">{formatNumber(item.quantity)}</p>
                            <p className="text-xs text-muted-foreground">{item.unit}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar material" : "Nuevo material"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={fieldErrors.name ? "border-destructive" : ""}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <Select
                  value={isNewCategory ? "__new__" : form.category}
                  onValueChange={(value) => {
                    if (value === "__new__") {
                      setIsNewCategory(true);
                      setForm({ ...form, category: "" });
                    } else {
                      setIsNewCategory(false);
                      setForm({ ...form, category: value });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__new__">➕ Nueva categoría…</SelectItem>
                  </SelectContent>
                </Select>
                {isNewCategory && (
                  <Input
                    className="mt-2"
                    placeholder="Escribe nueva categoría"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                )}
                {fieldErrors.category && <p className="text-xs text-destructive">{fieldErrors.category}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Unidad *</Label>
                <Select
                  value={isNewUnit ? "__new__" : form.unit}
                  onValueChange={(value) => {
                    if (value === "__new__") {
                      setIsNewUnit(true);
                      setForm({ ...form, unit: "" });
                    } else {
                      setIsNewUnit(false);
                      setForm({ ...form, unit: value });
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona unidad" /></SelectTrigger>
                  <SelectContent>
                    {allUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                    <SelectItem value="__new__">➕ Nueva unidad…</SelectItem>
                  </SelectContent>
                </Select>
                {isNewUnit && (
                  <Input
                    className="mt-2"
                    placeholder="Escribe nueva unidad"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                )}
                {fieldErrors.unit && <p className="text-xs text-destructive">{fieldErrors.unit}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => handleNumericChange("quantity", e.target.value)}
                  className={fieldErrors.quantity ? "border-destructive" : ""}
                />
                {fieldErrors.quantity && <p className="text-xs text-destructive">{fieldErrors.quantity}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Precio (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unitPrice}
                  onChange={(e) => handleNumericChange("unitPrice", e.target.value)}
                  className={fieldErrors.unitPrice ? "border-destructive" : ""}
                />
                {fieldErrors.unitPrice && <p className="text-xs text-destructive">{fieldErrors.unitPrice}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Stock mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) => handleNumericChange("minStock", e.target.value)}
                  className={fieldErrors.minStock ? "border-destructive" : ""}
                />
                {fieldErrors.minStock && <p className="text-xs text-destructive">{fieldErrors.minStock}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing
                ? updateMutation.isPending ? "Guardando..." : "Guardar cambios"
                : createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockPage;
