import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/api/auditApi";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";

const AuditPage = () => {
  const { data: entries = [], isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => auditApi.list() });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Auditoría" backTo="/dashboard" backLabel="Volver a inicio" subtitle="Historial de acciones del equipo" />

      <DataTable
        columns={[
          { key: "userName", header: "Usuario" },
          { key: "module", header: "Módulo", className: "capitalize" },
          { key: "action", header: "Acción" },
          { key: "details", header: "Detalles", className: "hidden md:table-cell" },
          { key: "createdAt", header: "Fecha", render: (r: any) => new Date(r.createdAt).toLocaleString("es-ES") },
        ]}
        data={entries as any}
        emptyMessage="No hay registros"
      />
    </div>
  );
};

export default AuditPage;
