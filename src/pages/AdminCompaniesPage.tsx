import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, CreateCompanyPayload } from "@/api/adminApi";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const emptyForm: CreateCompanyPayload = { name: "", nif: "", address: "", email: "", phone: "", ownerName: "", ownerEmail: "", ownerPassword: "" };

const AdminCompaniesPage = () => {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<CreateCompanyPayload>(emptyForm);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data: companies = [], isLoading } = useQuery({ queryKey: ["admin-companies"], queryFn: () => adminApi.listCompanies() });

  const createMut = useMutation({
    mutationFn: (p: CreateCompanyPayload) => adminApi.createCompany(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-companies"] }); setModal(false); setForm(emptyForm); toast.success("Empresa creada"); },
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => adminApi.deactivateCompany(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-companies"] }); setDeactivateId(null); toast.success("Empresa desactivada"); },
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => adminApi.activateCompany(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-companies"] }); toast.success("Empresa activada"); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Panel Superadmin — Empresas"
        actions={<Button onClick={() => setModal(true)}><Plus className="h-4 w-4" /> Nueva empresa</Button>}
      />

      <DataTable
        columns={[
          { key: "name", header: "Nombre" },
          { key: "owner", header: "Owner", render: (r: any) => r.owner?.name || "—" },
          { key: "employeeCount", header: "Empleados", className: "hidden sm:table-cell" },
          {
            key: "isActive", header: "Estado",
            render: (r: any) => r.isActive
              ? <Badge className="bg-success/10 text-success text-xs">Activa</Badge>
              : <Badge className="bg-destructive/10 text-destructive text-xs">Inactiva</Badge>,
          },
          {
            key: "actions", header: "",
            render: (row: any) => (
              <div className="flex gap-1">
                {row.isActive ? (
                  <Button variant="ghost" size="sm" className="text-destructive h-8 px-2"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeactivateId(row._id); }}>
                    Desactivar
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="text-success h-8 px-2"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); activateMut.mutate(row._id); }}>
                    Activar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        data={companies as any}
        emptyMessage="No hay empresas"
      />

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva empresa + Owner</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
            <div className="space-y-1 text-xs font-semibold uppercase text-muted-foreground">Datos empresa</div>
            <div className="space-y-2"><Label>Nombre empresa *</Label><Input maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>NIF</Label><Input maxLength={20} value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} /></div>
            <div className="space-y-2"><Label>Dirección</Label><Input maxLength={150} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" maxLength={150} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-1 text-xs font-semibold uppercase text-muted-foreground pt-2">Datos Owner</div>
            <div className="space-y-2"><Label>Nombre owner *</Label><Input maxLength={150} value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email owner *</Label><Input type="email" maxLength={150} value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contraseña owner *</Label><Input type="password" maxLength={50} value={form.ownerPassword} onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })} /></div>
            <Button type="submit" className="w-full"
              disabled={!form.name.trim() || !form.ownerName.trim() || !form.ownerEmail.trim() || !form.ownerPassword.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear empresa
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}
        title="Desactivar empresa" description="¿Seguro que quieres desactivar esta empresa?"
        onConfirm={() => deactivateId && deactivateMut.mutate(deactivateId)} loading={deactivateMut.isPending} />
    </div>
  );
};

export default AdminCompaniesPage;
