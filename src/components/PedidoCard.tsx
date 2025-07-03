import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Package, User } from 'lucide-react';
import { Pedido } from '@/pages/Dashboard';

interface PedidoCardProps {
  pedido: Pedido;
  onMarcarDespachado: (pedidoId: number) => void;
}

const PedidoCard = ({ pedido, onMarcarDespachado }: PedidoCardProps) => {
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calcularTotal = () => {
    return pedido.items.reduce((total, item) => {
      return total + (item.precio_total || 0);
    }, 0);
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const getEstadoBadge = () => {
    if (pedido.estado === 'despachado') {
      return (
        <Badge className="bg-success text-success-foreground">
          Despachado
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning text-warning-foreground">
        Pendiente
      </Badge>
    );
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-primary">
              #{pedido.id.toString().padStart(3, '0')}
            </h3>
            {getEstadoBadge()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatearFecha(pedido.fecha_creacion)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{pedido.nombre_cliente}</span>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              {pedido.direccion_entrega}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Productos:</span>
          </div>
          
          <div className="space-y-1">
            {pedido.items.map((item, index) => (
              <div key={index} className="text-sm pl-6">
                <div className="flex justify-between">
                  <span>{item.producto}</span>
                  <span className="text-muted-foreground">x{item.cantidad}</span>
                </div>
                {item.precio_total && (
                  <div className="text-xs text-muted-foreground">
                    {formatearPrecio(item.precio_total)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total:</span>
            <span className="text-lg font-bold text-primary">
              {formatearPrecio(calcularTotal())}
            </span>
          </div>
        </div>

        {pedido.estado === 'pendiente' && (
          <Button
            onClick={() => onMarcarDespachado(pedido.id)}
            className="w-full bg-secondary hover:bg-secondary/90"
          >
            Marcar como Despachado
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PedidoCard;