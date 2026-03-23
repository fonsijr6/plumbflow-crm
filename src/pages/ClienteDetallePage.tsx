import { useParams, useNavigate } from "react-router-dom";
import { mockClientes, mockTareas } from "@/data/mockData";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, StickyNote, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ClienteDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cliente = mockClientes.find((c) => c.id === id);
  const tareasCliente = mockTareas.filter((t) => t.clienteId === id);

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button variant="ghost" onClick={() => navigate("/clientes")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/clientes")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{cliente.nombre}</h1>
        <p className="text-sm text-muted-foreground mt-1">Cliente desde {new Date(cliente.fechaAlta).toLocaleDateString("es-ES", { year: "numeric", month: "long" })}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-base">Datos de contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Phone, label: cliente.telefono },
              { icon: Mail, label: cliente.email },
              { icon: MapPin, label: cliente.direccion },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </div>
            ))}
            {cliente.notas && (
              <div className="flex items-start gap-2.5 text-sm pt-2 border-t">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{cliente.notas}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader><CardTitle className="text-base">Historial de tareas</CardTitle></CardHeader>
          <CardContent>
            {tareasCliente.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin tareas registradas</p>
            ) : (
              <div className="space-y-3">
                {tareasCliente.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(t.fecha).toLocaleDateString("es-ES")} — {t.hora}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {t.estado === "pendiente" ? "Pendiente" : t.estado === "en_progreso" ? "En progreso" : "Completada"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClienteDetallePage;
