/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/api/auditApi";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const MODULE_LABELS: Record<string, string> = {
  clients: "Clientes",
  tasks: "Avisos",
  products: "Productos",
  stock: "Stock",
  invoices: "Facturas",
  quotes: "Presupuestos",
  users: "Empleados",
  auth: "Sesión",
};

const formatMeta = (meta?: Record<string, any>): string => {
  if (!meta || typeof meta !== "object") return "";
  const parts: string[] = [];
  if (meta.from && meta.to) parts.push(`${meta.from} → ${meta.to}`);
  if (meta.amount != null) parts.push(`Cantidad: ${meta.amount}`);
  if (meta.status) parts.push(`Estado: ${meta.status}`);
  if (meta.invoiceNumber) parts.push(`Factura ${meta.invoiceNumber}`);
  if (meta.quoteNumber) parts.push(`Presupuesto ${meta.quoteNumber}`);
  if (parts.length === 0) {
    const keys = Object.keys(meta).slice(0, 3);
    return keys.map((k) => `${k}: ${JSON.stringify(meta[k])}`).join(" · ");
  }
  return parts.join(" · ");
};

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("__all__");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => auditApi.list(),
  });

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (moduleFilter !== "__all__" && e.module !== moduleFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          const hay = [
            e.userId?.name,
            e.userId?.email,
            e.entityLabel,
            e.action,
            e.module,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(s)) return false;
        }
        return true;
      }),
    [entries, search, moduleFilter],
  );

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Auditoría"
        backTo="/dashboard"
        backLabel="Volver a inicio"
        subtitle="Historial de acciones del equipo"
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario, acción…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los módulos</SelectItem>
            {Object.entries(MODULE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={[
          {
            key: "userId",
            header: "Usuario",
            render: (r: any) => r.userId?.name || "—",
          },
          {
            key: "module",
            header: "Módulo",
            render: (r: any) => (
              <Badge variant="outline" className="capitalize">
                {MODULE_LABELS[r.module] || r.module}
              </Badge>
            ),
          },
          {
            key: "action",
            header: "Acción",
            render: (r: any) => (
              <div>
                <p className="font-medium">{r.entityLabel || r.action}</p>
                {r.entityLabel && (
                  <p className="text-xs text-muted-foreground">{r.action}</p>
                )}
              </div>
            ),
          },
          {
            key: "meta",
            header: "Detalles",
            className: "hidden md:table-cell text-xs text-muted-foreground",
            render: (r: any) => formatMeta(r.meta) || "—",
          },
          {
            key: "createdAt",
            header: "Fecha",
            render: (r: any) => new Date(r.createdAt).toLocaleString("es-ES"),
          },
        ]}
        data={filtered as any}
        emptyMessage="No hay registros"
      />
    </div>
  );
}
