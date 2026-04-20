import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi } from "@/api/stockApi";
import { IfPermission } from "@/components/common/IfPermission";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const StockPage = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<{ quantity: number; minStock: number; location: string; notes: string }>({
    quantity: 0, minStock: 0, location: "", notes: "",
  });

  const { data: stockItems = [], isLoading } = useQuery({ queryKey: ["stock"], queryFn: () => stockApi.list() });

  // Solo materiales (defensivo, el backend ya debería devolver solo materiales)
  const materials = stockItems.filter((s) => !s.product?.type || s.product?.type === "material");

  const updateMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: any }) => stockApi.update(id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stock"] }); setEditId(null); toast.success("Stock ajustado"); },
  });

  const filtered = materials.filter((s) =>
    (s.product?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.location || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoader />;

  const openEdit = (item: typeof stockItems[0]) => {
    setForm({
      quantity: item.quantity ?? 0,
      minStock: item.minStock ?? 0,
      location: item.location || "",
      notes: item.notes || "",
    });
    setEditId(item._id);
  };

  return (
    <div>
      <PageHeader title="Stock" backTo="/dashboard" backLabel="Volver a inicio" />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar producto…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        El stock se gestiona automáticamente al crear productos materiales y al emitir facturas.
        Solo owner/admin pueden hacer ajustes manuales.
      </p>

      <DataTable
        columns={[
          { key: "product", header: "Producto", render: (r: any) => r.product?.name || "—" },
          {
            key: "quantity", header: "Cantidad", render: (r: any) => {
              const qty = r.quantity as number;
              const low = r.minStock != null && qty <= r.minStock;
              return (
                <div className="flex items-center gap-2">
                  <span>{qty?.toLocaleString("es-ES")}</span>
                  {low && (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <AlertTriangle className="h-3 w-3" /> Bajo
                    </Badge>
                  )}
                </div>
              );
            }
          },
          { key: "minStock", header: "Mínimo", className: "hidden sm:table-cell", render: (r: any) => r.minStock?.toLocaleString("es-ES") ?? "—" },
          { key: "location", header: "Ubicación", className: "hidden sm:table-cell", render: (r: any) => r.location || "—" },
          {
            key: "actions", header: "", className: "w-24",
            render: (row: any) => (
              <IfPermission module="stock" action="edit">
                <Button variant="ghost" size="sm" className="h-8 px-2"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(row); }}>
                  Ajustar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filtered as any}
        emptyMessage="No hay productos materiales"
      />

      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar stock</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); editId && updateMut.mutate({ id: editId, p: form }); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input type="number" min={0} max={1000000} placeholder="0"
                value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Stock mínimo</Label>
              <Input type="number" min={0} max={1000000} placeholder="0"
                value={form.minStock || ""} onChange={(e) => setForm({ ...form, minStock: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input maxLength={150} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar ajuste
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockPage;
