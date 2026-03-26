/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Pencil, Trash2, FileText, Mail, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
} from "@/api/InvoiceApi";
import { Invoice } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/api/AxiosClient";

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

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fromClient = location.state?.fromClient as string | undefined;
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<Invoice["status"]>("draft");

  const {
    data: invoice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id!),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Invoice>) => updateInvoice(id!, payload),
    onSuccess: () => {
      toast.success("Factura actualizada");
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setEditOpen(false);
    },
    onError: () => toast.error("Error actualizando factura"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice(id!),
    onSuccess: () => {
      toast.success("Factura eliminada");
      navigate("/invoices");
    },
    onError: () => toast.error("Error eliminando factura"),
  });

  const downloadPdf = (invoice: Invoice) => {
    const doc = new jsPDF();

    // ✅ TÍTULO
    doc.setFontSize(18);
    doc.text(`Factura ${invoice.invoiceNumber}`, 14, 20);

    // ✅ DATOS EMISOR
    doc.setFontSize(12);
    doc.text("Emisor:", 14, 35);
    doc.text(invoice.issuerName, 14, 42);
    if (invoice.issuerNif) doc.text(`NIF: ${invoice.issuerNif}`, 14, 49);
    if (invoice.issuerAddress) doc.text(invoice.issuerAddress, 14, 56);

    // ✅ DATOS CLIENTE
    doc.text("Cliente:", 14, 72);
    doc.text(invoice.clientName, 14, 79);
    if (invoice.clientNif) doc.text(`NIF: ${invoice.clientNif}`, 14, 86);
    if (invoice.clientAddress) doc.text(invoice.clientAddress, 14, 93);

    // ✅ FECHAS
    doc.text(
      `Fecha emisión: ${new Date(invoice.date).toLocaleDateString("es-ES")}`,
      14,
      110,
    );
    if (invoice.dueDate) {
      doc.text(
        `Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString("es-ES")}`,
        14,
        117,
      );
    }

    // ✅ TABLA DE LÍNEAS
    autoTable(doc, {
      startY: 130,
      head: [["Descripción", "Cant.", "Precio", "IVA", "Importe"]],
      body: invoice.lines.map((l) => [
        l.description,
        l.quantity,
        `${l.unitPrice.toFixed(2)} €`,
        `${l.taxRate}%`,
        `${(l.unitPrice * l.quantity).toFixed(2)} €`,
      ]),
    });

    // ✅ TOTALES
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)} €`, 150, finalY);
    doc.text(`IVA: ${invoice.taxTotal.toFixed(2)} €`, 150, finalY + 7);
    doc.text(`Total: ${invoice.total.toFixed(2)} €`, 150, finalY + 14);

    // ✅ NOTAS
    if (invoice.notes) {
      doc.setFontSize(11);
      doc.text("Notas:", 14, finalY + 30);
      doc.text(invoice.notes, 14, finalY + 37);
    }

    // ✅ DESCARGA
    doc.save(`Factura-${invoice.invoiceNumber}.pdf`);
  };

  const sendEmailMutation = useMutation({
    mutationFn: () => sendInvoice(id!),
    onSuccess: () => {
      toast.success("Factura enviada por email");
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => toast.error("Error enviando la factura"),
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  if (isError || !invoice) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-muted-foreground">Factura no encontrada</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate("/invoices")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(fromClient ? `/clients/${fromClient}` : "/invoices")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> {fromClient ? "Volver a cliente" : "Volver a facturas"}
      </button>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {invoice.clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${statusColor[invoice.status]} text-sm px-3 py-1`}
          >
            {statusLabel[invoice.status]}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditStatus(invoice.status);
              setEditOpen(true);
            }}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" /> Estado
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendEmailMutation.mutate()}
          >
            <Mail className="mr-1 h-3.5 w-3.5" /> Enviar email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadPdf(invoice)}
          >
            <FileText className="mr-1 h-3.5 w-3.5" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => deleteMutation.mutate()}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
          </Button>
        </div>
      </div>

      {/* DATOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Emisor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{invoice.issuerName}</p>
            <p className="text-muted-foreground">
              NIF: {invoice.issuerNif || "—"}
            </p>
            <p className="text-muted-foreground">
              {invoice.issuerAddress || "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{invoice.clientName}</p>
            <p className="text-muted-foreground">
              NIF: {invoice.clientNif || "—"}
            </p>
            <p className="text-muted-foreground">
              {invoice.clientAddress || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FECHAS */}
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Fecha emisión:</span>{" "}
          <span className="font-medium">
            {new Date(invoice.date).toLocaleDateString("es-ES")}
          </span>
        </div>
        {invoice.dueDate && (
          <div>
            <span className="text-muted-foreground">Vencimiento:</span>{" "}
            <span className="font-medium">
              {new Date(invoice.dueDate).toLocaleDateString("es-ES")}
            </span>
          </div>
        )}
      </div>

      {/* LÍNEAS */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Conceptos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Descripción</th>
                  <th className="pb-2 font-medium text-right">Cant.</th>
                  <th className="pb-2 font-medium text-right">Precio</th>
                  <th className="pb-2 font-medium text-right">IVA</th>
                  <th className="pb-2 font-medium text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines?.map((line, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2">{line.description}</td>
                    <td className="py-2 text-right">{line.quantity}</td>
                    <td className="py-2 text-right">
                      {line.unitPrice.toFixed(2)} €
                    </td>
                    <td className="py-2 text-right">{line.taxRate}%</td>
                    <td className="py-2 text-right font-medium">
                      {(line.quantity * line.unitPrice).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-right space-y-1 border-t pt-3">
            <p className="text-sm">
              Subtotal:{" "}
              <span className="font-medium">
                {invoice.subtotal?.toFixed(2)} €
              </span>
            </p>
            <p className="text-sm">
              IVA:{" "}
              <span className="font-medium">
                {invoice.taxTotal?.toFixed(2)} €
              </span>
            </p>
            <p className="text-lg font-semibold">
              Total: {invoice.total?.toFixed(2)} €
            </p>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* DIALOG EDIT STATUS */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Estado</Label>
            <Select
              value={editStatus}
              onValueChange={(v) => setEditStatus(v as Invoice["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {invoice.status !== "sent" && (
                  <SelectItem value="draft">Borrador</SelectItem>
                )}
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => updateMutation.mutate({ status: editStatus })}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceDetailPage;
