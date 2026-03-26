import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, FileText, ChevronRight, Loader2, Home } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getInvoices, createInvoice } from "@/api/InvoiceApi";
import { getClients } from "@/api/ClientApi";
import { Invoice, InvoiceLine, Client } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { validateInvoiceForm, formatCurrency } from "@/lib/validators";

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

/* --------------------------------------------------
   CONFIG
-------------------------------------------------- */

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

/* --------------------------------------------------
   PAGE
-------------------------------------------------- */

const InvoicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const newForClient = params.get("new");

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const issuerName = user?.name || "";
  const issuerEmail = user?.email || "";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ✅ Filtro de fechas */
  const [dateFilter, setDateFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    clientNif: "",
    issuerName: user?.name || "",
    issuerNif: user?.issuerNif || "",
    issuerEmail: user?.issuerEmail || user?.email || "",
    issuerAddress: user?.issuerAddress || "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    lines: [emptyLine()],
    notes: "",
    status: "draft" as Invoice["status"],
  });

  /* --------------------------------------------------
     DATA FETCH
  -------------------------------------------------- */

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  /* --------------------------------------------------
     NUEVA FACTURA DESDE CLIENT DETAIL
  -------------------------------------------------- */

  useEffect(() => {
    if (newForClient && clients) {
      const client = clients.find((c) => c.id === newForClient);
      if (client) {
        setForm({
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email,
          clientAddress: client.address,
          clientNif: "",
          issuerName: user?.name || "",
          issuerNif: user?.issuerNif || "",
          issuerEmail: user?.issuerEmail || user?.email || "",
          issuerAddress: user?.issuerAddress || "",
          date: new Date().toISOString().split("T")[0],
          dueDate: "",
          lines: [emptyLine()],
          notes: "",
          status: "draft",
        });
        setDialogOpen(true);
      }
    }
  }, [
    newForClient,
    clients,
    issuerName,
    issuerEmail,
    user?.name,
    user?.issuerNif,
    user?.issuerEmail,
    user?.email,
    user?.issuerAddress,
  ]);

  /* --------------------------------------------------
     MUTATION
  -------------------------------------------------- */

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      toast.success("Factura creada");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Error creando factura"),
  });

  /* --------------------------------------------------
     LÓGICA DE FILTRO DE FECHAS
  -------------------------------------------------- */

  const isWithinDateFilter = (inv: Invoice) => {
    const invDate = new Date(inv.date);
    const today = new Date();

    if (dateFilter === "all") return true;

    if (dateFilter === "today") {
      return invDate.toDateString() === today.toDateString();
    }

    if (dateFilter === "7days") {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      return invDate >= weekAgo && invDate <= today;
    }

    if (dateFilter === "month") {
      return (
        invDate.getMonth() === today.getMonth() &&
        invDate.getFullYear() === today.getFullYear()
      );
    }

    if (dateFilter === "lastmonth") {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return (
        invDate.getMonth() === lastMonth.getMonth() &&
        invDate.getFullYear() === lastMonth.getFullYear()
      );
    }

    if (dateFilter === "custom") {
      if (!customStart || !customEnd) return true;
      const start = new Date(customStart);
      const end = new Date(customEnd);
      return invDate >= start && invDate <= end;
    }

    return true;
  };

  /* --------------------------------------------------
     SUPER FILTRO COMBINADO
  -------------------------------------------------- */

  const filtered =
    invoices?.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : inv.status === statusFilter;

      const matchesDate = isWithinDateFilter(inv);

      return matchesSearch && matchesStatus && matchesDate;
    }) || [];

  /* --------------------------------------------------
     SAVE
  -------------------------------------------------- */

  const calcTotals = (lines: InvoiceLine[]) => {
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const taxTotal = lines.reduce(
      (s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100),
      0,
    );
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const updateLine = (
    idx: number,
    field: keyof InvoiceLine,
    value: string | number,
  ) => {
    const updated = [...form.lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, lines: updated });
  };

  const addLine = () =>
    setForm({ ...form, lines: [...form.lines, emptyLine()] });

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
        clientEmail: c.email,
        clientNif: "",
      });
    }
  };

  const handleSave = () => {
    const errors = validateInvoiceForm(form);
    if (errors.length) {
      toast.error(errors[0].message);
      return;
    }

    const totals = calcTotals(form.lines);
    const invoiceNumber = `FAC-${Date.now().toString().slice(-6)}`;

    createMutation.mutate({ ...form, ...totals, invoiceNumber });
  };

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <Home className="h-4 w-4" /> Volver a inicio
      </button>
      {/* HEADER */}
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Facturas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {invoices?.length ?? 0} facturas registradas
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Nueva factura
          </Button>
        </div>

        {/* 🔥 BUSCADOR + ESTADO + FECHA */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* BUSCADOR */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar factura o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* FILTRO ESTADO */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="sent">Enviada</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
            </SelectContent>
          </Select>

          {/* FILTRO FECHA */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="7days">Últimos 7 días</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="lastmonth">Mes pasado</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* RANGO PERSONALIZADO */}
        {dateFilter === "custom" && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full"
            />
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* LISTA */}
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
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.clientName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(inv.total)}
                    </p>
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

      {/* MODAL NUEVA FACTURA  ✅ (tu modal original completo) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* DATOS EMISOR */}
            <div>
              <p className="text-sm font-medium mb-2">Datos del emisor</p>

              {/* FILA 1 → Nombre + NIF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre / Razón social</Label>
                  <Input value={form.issuerName} disabled />
                </div>

                <div className="space-y-1.5">
                  <Label>NIF / CIF</Label>
                  <Input value={form.issuerNif} disabled />
                </div>
              </div>

              {/* FILA 2 → Dirección fiscal completa */}
              <div className="space-y-1.5 mt-3">
                <Label>Dirección fiscal</Label>
                <Input value={form.issuerAddress} disabled />
              </div>
            </div>

            {/* DATOS CLIENTE */}
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
                    onChange={(e) =>
                      setForm({ ...form, clientNif: e.target.value })
                    }
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
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
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
                      {idx === 0 && (
                        <Label className="text-xs">Descripción</Label>
                      )}
                      <Input
                        value={line.description}
                        onChange={(e) =>
                          updateLine(idx, "description", e.target.value)
                        }
                        placeholder="Concepto"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">Cantidad</Label>}
                      <Input
                        type="number"
                        min="0"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", Math.max(0, Number(e.target.value)))
                        }
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">Precio €</Label>}
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, "unitPrice", Math.max(0, Number(e.target.value)))
                        }
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      {idx === 0 && <Label className="text-xs">IVA %</Label>}
                      <Input
                        type="number"
                        min="0"
                        value={line.taxRate}
                        onChange={(e) =>
                          updateLine(idx, "taxRate", Math.max(0, Number(e.target.value)))
                        }
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

              <div className="mt-4 text-right space-y-1 text-sm">
                <p>
                  Subtotal:
                  <span className="font-medium">
                    {calcTotals(form.lines).subtotal.toFixed(2)} €
                  </span>
                </p>
                <p>
                  IVA:
                  <span className="font-medium">
                    {calcTotals(form.lines).taxTotal.toFixed(2)} €
                  </span>
                </p>
                <p className="text-base font-semibold">
                  Total: {calcTotals(form.lines).total.toFixed(2)} €
                </p>
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
