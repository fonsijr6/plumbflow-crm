import { useState } from "react";
import { mockClientes, Cliente } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Search, Phone, Mail, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const ClientesPage = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = mockClientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-1">{mockClientes.length} clientes registrados</p>
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

      <div className="space-y-2">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="cursor-pointer border shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            onClick={() => navigate(`/clientes/${c.id}`)}
          >
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
    </div>
  );
};

export default ClientesPage;
