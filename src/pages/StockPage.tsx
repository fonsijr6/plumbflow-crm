/* eslint-disable @typescript-eslint/no-explicit-any */

// Common components
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { IfPermission } from "@/components/common/IfPermission";

// UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Icons & utils
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/* -------------------------------------------------
   Página
------------------------------------------------- */

export default function StockPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    quantity: 0,
    minStock: 0,
    location: "",
    notes: "",
  });

  /* -------------------------------------------------
     Queries
  ------------------------------------------------- */

  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: stockApi.list,
  });

  // Solo materiales (extra defensivo)
  const materials = stockItems.filter(
    (s: any) => !s.product || s.product?.type === "material",
  );

  /* -------------------------------------------------
     Mutations
  ------------------------------------------------- */

  const adjustMut = useMutation({
    mutationFn: ({ stockId, amount }: { stockId: string; amount: number }) =>
      stockApi.adjust({
        stockId,
        amount,
      }),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      setEditId(null);
      toast.success("Stock ajustado");
    },
  });
  /* -------------------------------------------------
     Helpers
  ------------------------------------------------- */

  const filteredItems = materials.filter(
    (s: any) =>
      (s.product?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.location || "").toLowerCase().includes(search.toLowerCase()),
  );

  const openEdit = (item: any) => {
    setForm({
      quantity: item.quantity ?? 0,
      minStock: item.minStock ?? 0,
      location: item.location || "",
      notes: item.notes || "",
    });

    setEditId(item._id);
  };

  if (isLoading) return <PageLoader />;

  /* -------------------------------------------------
     Render
  ------------------------------------------------- */

  return (
    <div>
      <PageHeader
        title="Stock"
        backTo="/dashboard"
        backLabel="Volver a inicio"
      />

      {/* Buscador */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Nota */}
      <p className="mb-3 text-xs text-muted-foreground">
        El stock se gestiona automáticamente al crear productos materiales y al
        emitir facturas. Solo owner y admin pueden realizar ajustes manuales.
      </p>

      {/* Tabla */}
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
            header: "Mínimo",
            className: "hidden sm:table-cell",
            render: (r: any) =>
              r.minStock != null ? r.minStock.toLocaleString("es-ES") : "—",
          },
          {
            key: "unitPrice",
            header: "Precio",
            className: "hidden sm:table-cell",
            render: (r: any) =>
              r.productId?.unitPrice != null
                ? r.productId.unitPrice.toLocaleString("es-ES", {
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
                  onClick={() => openEdit(row)}
                >
                  Ajustar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filteredItems}
        emptyMessage="No hay productos materiales"
      />

      {/* Modal Ajuste */}
      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editId) return;

              adjustMut.mutate({
                stockId: editId,
                amount: form.quantity,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Stock mínimo</Label>
              <Input
                type="number"
                min={1}
                value={form.minStock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minStock: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input
                maxLength={150}
                value={form.location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    location: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                maxLength={500}
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={adjustMut.isPending}
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

// React Query
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { stockApi } from "@/api/stockApi";

// API
