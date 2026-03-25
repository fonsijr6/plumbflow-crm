import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FileText, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInvoices, createInvoice } from "@/api/InvoiceApi";
import { getClients } from "@/api/ClientApi";
import { Invoice, InvoiceLine, Client } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-primary/10 text-primary border-primary/30",
  paid: "bg-success/15 text-success border-success/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
};

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
};

const emptyLine = (): InvoiceLine => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
  taxRate: 21,
});

const InvoicesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    clientAddress: "",
    clientNif: "",
    issuerName: user?.name || "",
    issuerNif: "",
    issuerAddress: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    lines: [emptyLine()],
    notes: "",
    status: "draft" as Invoice["status"],
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      toast.success("Factura creada");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Error creando factura"),
  });

  const calcTotals = (lines: InvoiceLine[]) => {
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const taxTotal = lines.reduce(
      (s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100),
      0,
    );
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const updateLine = (idx: number, field: keyof InvoiceLine, value: string | number) => {
    const updated = [...form.lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, lines: updated });
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, emptyLine()] });

  const removeLine = (idx: number) => {
    if (form.lines.length <= 1) return;
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  };

  const selectClient = (clientId: string) => {
    const c = clients?.find((cl: Client) => cl.id === clientId);
    if (c) {
      setForm({
        ...form,
        clientId: c.id,
        clientName: c.name,
        clientAddress: c.address,
        clientNif: "",
      });
    }
  };

  const handleSave = () => {
    if (!form.clientId) return toast.error("Selecciona un cliente");
    if (!form.lines.some((l) => l.description.trim())) return toast.error("Añade al menos un concepto");
    const totals = calcTotals(form.lines);
    const invoiceNumber = `FAC-${Date.now().toString().slice(-6)}`;
    createMutation.mutate({ ...form, ...totals, invoiceNumber });
  };

  const openNew = () => {
    setForm({
      clientId: "",
      clientName: "",
      clientAddress: "",
      clientNif: "",
      issuerName: user?.name || "",
      issuerNif: "",
      issuerAddress: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: "",
      lines: [emptyLine()],
      notes: "",
      status: "draft",
    });
    setDialogOpen(true);
  };

  const filtered =
    invoices?.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  if (isLoading) {
    return <p className="py-12 text-center text-muted-foreground">Cargando facturas...</p>;
  }

  const totals = calcTotals(form.lines);

  return (
    <div className="flex h-full flex-col">
      {/* STICKY HEADER */}
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Facturas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {invoices?.length ?? 0} facturas registradas
            </p>
          </div>
          <Button onClick={openNew} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Nueva factura
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar factura o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* SCROLLABLE LIST */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-2 pb-4">
          {filtered.map((inv) => (
            <Card
              key={inv.id}
              className="cursor-pointer border shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => navigate(`/invoices/${inv.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{inv.clientName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{inv.total.toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.date).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColor[inv.status]}>
                    {statusLabel[inv.status]}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No se han encontrado facturas
            </p>
          )}
        </div>
      </ScrollArea>

      {/* NEW INVOICE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* DATOS EMISOR */}
            <div>
              <p className="text-sm font-medium mb-2">Datos del emisor</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre / Razón social</Label>
                  <Input
                    value={form.issuerName}
                    onChange={(e) => setForm({ ...form, issuerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>NIF / CIF</Label>
                  <Input
                    value={form.issuerNif}
                    onChange={(e) => setForm({ ...form, issuerNif: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Dirección</Label>
                  <Input
                    value={form.issuerAddress}
                    onChange={(e) => setForm({ ...form, issuerAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* CLIENTE */}
            <div>
              <p className="text-sm font-medium mb-2">Datos del cliente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Cliente *</Label>
                  <Select value={form.clientId} onValueChange={selectClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((c: Client) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>NIF / CIF del cliente</Label>
                  <Input
                    value={form.clientNif}
                    onChange={(e) => setForm({ ...form, clientNif: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* FECHAS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha emisión</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha vencimiento</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            {/* LÍNEAS */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Conceptos</p>
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-1 h-3 w-3" /> Añadir línea
                </Button>
              </div>

              <div className="space-y-2">
                {form.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
                      {idx === 0 && <Label className="text-xs">Descripción</Label>}
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(idx, "description", e.target.value)}
                        placeholder="Concepto"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">Cantidad</Label>}
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">Precio €</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">IVA %</Label>}
                      <Input
                        type="number"
                        value={line.taxRate}
                        onChange={(e) => updateLine(idx, "taxRate", Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeLine(idx)}
                        disabled={form.lines.length <= 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTALS */}
              <div className="mt-4 text-right space-y-1 text-sm">
                <p>Subtotal: <span className="font-medium">{totals.subtotal.toFixed(2)} €</span></p>
                <p>IVA: <span className="font-medium">{totals.taxTotal.toFixed(2)} €</span></p>
                <p className="text-base font-semibold">Total: {totals.total.toFixed(2)} €</p>
              </div>
            </div>

            {/* NOTAS */}
            <div className="space-y-1.5">
              <Label>Notas / Observaciones</Label>
              <Textarea
                value={form.notes}
                rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Guardando..." : "Crear factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
