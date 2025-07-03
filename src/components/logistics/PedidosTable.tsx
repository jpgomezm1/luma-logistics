import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface Pedido {
  id: number;
  nombre_cliente: string;
  direccion_entrega: string;
  items: any[];
  volumen_total_m3: number;
  prioridad: number;
  fecha_creacion: string;
  fecha_limite_entrega: string;
}

interface PedidosTableProps {
  pedidos: Pedido[];
  onAsignarRuta: (pedidoIds: number[]) => void;
}

const PedidosTable = ({ pedidos, onAsignarRuta }: PedidosTableProps) => {
  const [selectedPedidos, setSelectedPedidos] = useState<number[]>([]);

  const togglePedido = (pedidoId: number) => {
    setSelectedPedidos(prev => 
      prev.includes(pedidoId) 
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const selectAll = () => {
    setSelectedPedidos(pedidos.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPedidos([]);
  };

  const getPrioridadColor = (prioridad: number) => {
    if (prioridad >= 3) return 'bg-destructive text-destructive-foreground';
    if (prioridad === 2) return 'bg-warning text-warning-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  const getPrioridadTexto = (prioridad: number) => {
    if (prioridad >= 3) return 'Urgente';
    if (prioridad === 2) return 'Media';
    return 'Normal';
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const esUrgente = (fechaLimite: string) => {
    const fecha = new Date(fechaLimite);
    const hoy = new Date();
    const diasRestantes = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 1;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedidos Pendientes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Seleccionar todos
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Limpiar
            </Button>
            <Button 
              onClick={() => onAsignarRuta(selectedPedidos)}
              disabled={selectedPedidos.length === 0}
              size="sm"
            >
              Asignar a Ruta ({selectedPedidos.length})
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {pedidos.map((pedido) => (
            <div 
              key={pedido.id}
              className={`p-4 border rounded-lg transition-colors ${
                selectedPedidos.includes(pedido.id) 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedPedidos.includes(pedido.id)}
                  onCheckedChange={() => togglePedido(pedido.id)}
                  className="mt-1"
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">#{pedido.id.toString().padStart(3, '0')}</span>
                      <Badge className={getPrioridadColor(pedido.prioridad)}>
                        {getPrioridadTexto(pedido.prioridad)}
                      </Badge>
                      {esUrgente(pedido.fecha_limite_entrega) && (
                        <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Vol: {pedido.volumen_total_m3?.toFixed(1) || 0} m³
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{pedido.nombre_cliente}</div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {pedido.direccion_entrega.substring(0, 50)}...
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Productos:</div>
                      <div className="space-y-1">
                        {pedido.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-xs">
                            • {item.producto} x{item.cantidad}
                          </div>
                        ))}
                        {pedido.items?.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{pedido.items.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Creado: {formatearFecha(pedido.fecha_creacion)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        Límite: {formatearFecha(pedido.fecha_limite_entrega)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {pedidos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay pedidos pendientes para esta bodega
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PedidosTable;