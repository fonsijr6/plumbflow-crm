/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Loader2, AlertTriangle } from "lucide-react";

import { stockApi } from "@/api/stockApi";
import { productsApi } from "@/api/productsApi";

import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { IfPermission } from "@/components/common/IfPermission";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StockPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);

  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: stockApi.list,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  // map productId -> category
  const productCategoryMap = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p: any) => m.set(p._id, p.category || ""));
    return m;
  }, [products]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p: any) => p.category && s.add(p.category));
    return Array.from(s).sort();
  }, [products]);

  const materials = stockItems.filter(
    (s: any) => !s.productId?.type || s.productId.type === "material",
  );

  const filtered = materials.filter((s: any) => {
    const name = s.productId?.name || "";
    const cat = productCategoryMap.get(s.productId?._id) || "";
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "__all__" && cat !== categoryFilter) return false;
    return true;
  });

  const adjustMut = useMutation({
    mutationFn: ({ stockId, amount }: { stockId: string; amount: number }) =>
      stockApi.adjust({ stockId, amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      setEditId(null);
      setAmount(0);
      toast.success("Stock ajustado");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.msg || "Error al ajustar stock"),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Stock" backTo="/dashboard" backLabel="Volver a inicio" />

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        El stock se gestiona automáticamente al crear productos materiales y al
        emitir facturas. Solo owner y admin pueden realizar ajustes manuales.
      </p>

      <DataTable
        columns={[
          {
            key: "product",
            header: "Producto",
            render: (r: any) => r.productId?.name || "—",
          },
          {
            key: "quantity",
            header: "Cantidad",
            render: (r: any) => {
              const qty = r.quantity as number;
              const isLow = r.minStock != null && qty <= r.minStock;
              return (
                <div className="flex items-center gap-2">
                  <span>{qty.toLocaleString("es-ES")}</span>
                  {isLow && (
                    <Badge
                      variant="destructive"
                      className="text-[10px] flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Bajo
                    </Badge>
                  )}
                </div>
              );
            },
          },
          {
            key: "minStock",
            header: "Stock mínimo",
            className: "hidden sm:table-cell",
            render: (r: any) => (r.minStock ?? 0).toLocaleString("es-ES"),
          },
          {
            key: "price",
            header: "Precio unit.",
            className: "hidden md:table-cell",
            render: (r: any) =>
              r.productId?.price != null
                ? r.productId.price.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  })
                : "—",
          },
          {
            key: "actions",
            header: "",
            className: "w-24",
            render: (row: any) => (
              <IfPermission module="stock" action="edit">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    setEditId(row._id);
                    setAmount(0);
                  }}
                >
                  Ajustar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filtered}
        emptyMessage="No hay productos materiales"
      />

      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editId || !amount) return;
              adjustMut.mutate({ stockId: editId, amount });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Cantidad a ajustar (positiva o negativa) *</Label>
              <Input
                type="number"
                placeholder="Ej. 5 o -3"
                value={amount === 0 ? "" : amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Usa valores positivos para sumar y negativos para restar.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!amount || adjustMut.isPending}
            >
              {adjustMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Guardar ajuste
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
