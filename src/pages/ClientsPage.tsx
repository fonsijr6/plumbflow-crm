/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Phone, Mail, ChevronRight, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients, createClient } from "@/api/ClientApi";
import { Client } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const emptyClient = (): Omit<Client, "id" | "createdAt"> => ({
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
});

const ClientsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Omit<Client, "id" | "createdAt">>(emptyClient());

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast.success("Cliente creado satisfactoriamente");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
      setForm(emptyClient());
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Error creando cliente");
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    createMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <p className="text-center py-12 text-muted-foreground">Cargando clientes...</p>
    );
  }

  const filtered =
    clients?.filter((c) =>
      [c.name, c.phone, c.email]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];

  return (
    <div className="flex h-full flex-col">
      {/* STICKY HEADER */}
      <div className="shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {clients?.length ?? 0} clientes registrados
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* SCROLLABLE CLIENT LIST */}
      <ScrollArea className="flex-1 -mx-1 px-1">
        <div className="space-y-2 pb-4">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer border shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              onClick={() => navigate(`/clients/${c.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No se han encontrado clientes
            </p>
          )}
        </div>
      </ScrollArea>

      {/* DIALOG - CREATE NEW CLIENT */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
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
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
