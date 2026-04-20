import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Product } from "@/api/productsApi";

export interface LineItem {
  productId: string;
  quantity: number;
  // snapshot opcional para mostrar al editar (no se envía)
  name?: string;
  unit?: string;
  unitPrice?: number;
  taxRate?: number;
  productType?: "material" | "service";
}

interface Props {
  items: LineItem[];
  products: Product[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
}

export const LineItemsEditor = ({ items, products, onChange, disabled }: Props) => {
  const addLine = () => onChange([...items, { productId: "", quantity: 1 }]);
  const removeLine = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const onProductChange = (idx: number, productId: string) => {
    const p = products.find((x) => x._id === productId);
    updateLine(idx, {
      productId,
      name: p?.name,
      unit: p?.unit,
      unitPrice: p?.unitPrice ?? p?.price,
      taxRate: p?.taxRate ?? 21,
      productType: p?.type,
    });
  };

  const lineTotal = (l: LineItem) => {
    const price = l.unitPrice ?? 0;
    const tax = l.taxRate ?? 0;
    return (l.quantity || 0) * price * (1 + tax / 100);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Conceptos</Label>
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-3 w-3" /> Línea
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Añade al menos una línea</p>
      )}

      {items.map((line, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-end border border-border rounded-lg p-3">
          <div className="col-span-12 sm:col-span-6 space-y-1">
            <Label className="text-xs">Producto / servicio</Label>
            <Select value={line.productId} onValueChange={(v) => onProductChange(idx, v)} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} <span className="text-muted-foreground text-xs ml-1">({p.type === "material" ? "mat" : "srv"})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-4 sm:col-span-2 space-y-1">
            <Label className="text-xs">Cantidad</Label>
            <Input type="number" min={0} max={100000} step="0.01" disabled={disabled}
              value={line.quantity || ""} onChange={(e) => updateLine(idx, { quantity: +e.target.value })} />
          </div>

          <div className="col-span-4 sm:col-span-2 space-y-1">
            <Label className="text-xs">Precio</Label>
            <Input value={line.unitPrice != null ? line.unitPrice.toFixed(2) : "—"} readOnly disabled />
          </div>

          <div className="col-span-3 sm:col-span-1 space-y-1">
            <Label className="text-xs">IVA%</Label>
            <Input value={line.taxRate ?? "—"} readOnly disabled />
          </div>

          <div className="col-span-1 sm:col-span-1 flex justify-end">
            {!disabled && items.length > 0 && (
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLine(idx)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {line.productId && (
            <div className="col-span-12 text-right text-xs text-muted-foreground">
              Total línea: {lineTotal(line).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
