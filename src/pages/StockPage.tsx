import { useState } from "react";
import { mockStock } from "@/data/mockData";
import { Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const StockPage = () => {
  const [search, setSearch] = useState("");

  const filtered = mockStock.filter(
    (s) =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.categoria.toLowerCase().includes(search.toLowerCase())
  );

  const categorias = [...new Set(filtered.map((s) => s.categoria))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
        <p className="text-sm text-muted-foreground mt-1">{mockStock.length} productos registrados</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {categorias.map((cat) => (
        <div key={cat} className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{cat}</h2>
          {filtered
            .filter((s) => s.categoria === cat)
            .map((item) => {
              const lowStock = item.cantidad <= item.stockMinimo;
              return (
                <Card key={item.id} className="border shadow-sm">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.nombre}</p>
                        {lowStock && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Stock bajo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.precioUnitario.toFixed(2)} € / {item.unidad}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{item.cantidad}</p>
                      <p className="text-xs text-muted-foreground">{item.unidad}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No se encontraron productos</p>
      )}
    </div>
  );
};

export default StockPage;
