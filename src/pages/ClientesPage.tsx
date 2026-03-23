import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Cliente } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Search, Phone, Mail, ChevronRight, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const emptyCliente = (): Omit<Cliente, "id"> => ({
  nombre: "", telefono: "", email: "", direccion: "", notas: "",
  fechaAlta: new Date().toISOString().split("T")[0],
});

const ClientesPage = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Omit<Cliente, "id">>(emptyCliente());
  const navigate = useNavigate();
  const { clientes, addCliente } = useData();

  const filtered = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    addCliente(form);
    toast.success("Cliente creado correctamente");
    setDialogOpen(false);
    setForm(emptyCliente());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clientes.length} clientes registrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nuevo cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <Card key={c.id} className="cursor-pointer border shadow-sm transition-all hover:shadow-md hover:border-primary/30" onClick={() => navigate(`/clientes/${c.id}`)}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="font-medium text-sm">{c.nombre}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefono}</span>
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No se encontraron clientes</p>
        )}
      </div>

      {/* Dialog nuevo cliente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesPage;
