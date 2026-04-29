/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IfPermission } from "@/components/common/IfPermission";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";

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

import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProductPayload, productsApi } from "@/api/productsApi";

/* -------------------- Constantes -------------------- */

const UNITS = ["unidad", "kg", "m", "litro", "hora"];

const emptyProduct: ProductPayload = {
  name: "",
  type: "material",
  unit: "unidad",
  price: 0,
  taxRate: 21,
  initialStock: 0,
  description: "",
};

/* -------------------- Página -------------------- */

const ProductsPage = () => {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProductPayload>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* -------------------- Queries -------------------- */

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  /* -------------------- Mutations -------------------- */

  const createMut = useMutation({
    mutationFn: (payload: ProductPayload) => productsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      setModalOpen(false);
      setForm(emptyProduct);
      toast.success("Producto creado");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleteId(null);
      toast.success("Producto eliminado");
    },
  });

  /* -------------------- Helpers -------------------- */

  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  if (isLoading) return <PageLoader />;

  /* -------------------- Render -------------------- */

  return (
    <div>
      <PageHeader
        title="Productos"
        backTo="/dashboard"
        backLabel="Volver a inicio"
        actions={
          <IfPermission module="products" action="create">
            <Button
              onClick={() => {
                setForm(emptyProduct);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </IfPermission>
        }
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

      {/* Tabla */}
      <DataTable
        columns={[
          { key: "name", header: "Nombre" },
          {
            key: "type",
            header: "Tipo",
            render: (r: any) => (
              <Badge
                variant={r.type === "material" ? "default" : "secondary"}
                className="text-xs"
              >
                {r.type === "material" ? "Material" : "Servicio"}
              </Badge>
            ),
          },
          {
            key: "unit",
            header: "Unidad",
            className: "hidden sm:table-cell",
          },
          {
            key: "price",
            header: "Precio",  
            render: (p) =>
            typeof p.price === "number"
              ? p.price.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                })
              : p.price,
          },
          {
            key: "taxRate",
            header: "IVA",
            className: "hidden md:table-cell",
            render: (r: any) => `${r.taxRate}%`,
          },
          {
            key: "actions",
            header: "",
            className: "w-10",
            render: (row: any) => (
              <IfPermission module="products" action="delete">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-8 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(row._id);
                  }}
                >
                  Eliminar
                </Button>
              </IfPermission>
            ),
          },
        ]}
        data={filteredProducts}
        emptyMessage="No hay productos"
      />

      {/* Modal crear */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                maxLength={150}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={form.type}
                onValueChange={(v: "material" | "service") =>
                  setForm({ ...form, type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">
                    Material (gestiona stock)
                  </SelectItem>
                  <SelectItem value="service">Servicio (sin stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio unitario *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>IVA %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.taxRate ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      taxRate: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {form.type === "material" && (
              <div className="space-y-2">
                <Label>Stock inicial</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.initialStock || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      initialStock: Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  El stock se creará automáticamente al guardar.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                maxLength={150}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                !form.name.trim() ||
                form.price === undefined ||
                form.price < 0 ||
                createMut.isPending
              }
            >
              {createMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Crear producto
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Eliminar producto"
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
};

export default ProductsPage;
