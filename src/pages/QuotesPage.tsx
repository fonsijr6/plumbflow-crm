/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

/* -------------------- Estados -------------------- */

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  accepted: "Aceptado",
  rejected: "Rechazado",
  converted: "Convertido",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  converted: "bg-primary/10 text-primary",
};

const QuotesPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [form, setForm] = useState({ clientId: "", notes: "" });

  /* -------------------- Queries -------------------- */

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: quotesApi.list,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: clientsApi.list,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const selectableProducts = useMemo(
    () => products.filter((p: Product) => p.isActive),
    [products],
  );

  /* -------------------- Mutations -------------------- */

  const createMut = useMutation({
    mutationFn: (payload: QuotePayload) => quotesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      setModalOpen(false);
      setItems([]);
      toast.success("Presupuesto creado");
    },
  });

  /* -------------------- Helpers -------------------- */

  const filtered = quotes.filter(
    (q: any) =>
      q.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber?.includes(search),
  );

  if (isLoading) return <PageLoader />;

  /* -------------------- Submit -------------------- */

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clientId || items.length === 0) return;
    if (items.some((i) => !i.product || !i.quantity)) return;

    // --- calcular líneas ---
    const lines = items.map((i) => {
      const unitPrice = i.product!.unitPrice;
      const taxRate = i.product!.taxRate;
      const quantity = i.quantity;

      const lineSubtotal = quantity * unitPrice;
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;

      return {
        productId: i.product!._id,
        name: i.product!.name,
        productType: i.product!.type,
        unit: i.product!.unit,
        unitPrice,
        taxRate,
        quantity,
        total: lineTotal,

        // solo frontend
        _subtotal: lineSubtotal,
        _tax: lineTax,
      };
    });

    // --- calcular totales de presupuesto ---
    const subtotal = lines.reduce((sum, l) => sum + l._subtotal, 0);

    const taxTotal = lines.reduce((sum, l) => sum + l._tax, 0);

    const total = subtotal + taxTotal;

    const payload: QuotePayload = {
      clientId: form.clientId,
      notes: form.notes,
      items: lines.map(({ _subtotal, _tax, ...l }) => l),
      subtotal,
      taxTotal,
      total,
    };

    createMut.mutate(payload);
  };

  /* -------------------- Render -------------------- */

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        backTo="/dashboard"
        backLabel="Volver a inicio"
        actions={
          <IfPermission module="quotes" action="create">
            <Button
              onClick={() => {
                setForm({ clientId: "", notes: "" });
                setItems([{ product: null, quantity: 1 }]);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nuevo presupuesto
            </Button>
          </IfPermission>
        }
      />

      {/* Buscador */}
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar presupuesto…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <DataTable
        columns={[
          {
            key: "quoteNumber",
            header: "#",
            render: (r: any) => `#${r.quoteNumber || "—"}`,
          },
          {
            key: "client",
            header: "Cliente",
            render: (r: any) => r.client?.name || "—",
          },
          {
            key: "total",
            header: "Total",
            render: (r: any) =>
              r.total?.toLocaleString("es-ES", {
                style: "currency",
                currency: "EUR",
              }),
          },
          {
            key: "status",
            header: "Estado",
            render: (r: any) => (
              <Badge className={cn("text-xs", STATUS_COLOR[r.status])}>
                {STATUS_LABEL[r.status]}
              </Badge>
            ),
          },
        ]}
        data={filtered}
        onRowClick={(row: any) => navigate(`/quotes/${row._id}`)}
        emptyMessage="No hay presupuestos"
      />

      {/* Modal Crear */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo presupuesto</DialogTitle>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm({ ...form, clientId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LineItemsEditor
              items={items}
              products={selectableProducts}
              onChange={setItems}
            />

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                maxLength={1500}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                !form.clientId ||
                items.length === 0 ||
                items.some((i) => !i.product) ||
                createMut.isPending
              }
            >
              {createMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Crear presupuesto (borrador)
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotesPage;
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotesApi, QuotePayload } from "@/api/quotesApi";
import { clientsApi } from "@/api/clientsApi";
import { productsApi, Product } from "@/api/productsApi";

import { IfPermission } from "@/components/common/IfPermission";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { LineItem, LineItemsEditor } from "@/components/common/LineItemsEditor";
