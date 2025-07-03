import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, User, DollarSign } from 'lucide-react';
import { Pedido } from '@/pages/Dashboard';

interface PedidoCardProps {
  pedido: Pedido;
  onMarcarDespachado: (pedidoId: number) => void;
}

const PedidoCard = ({ pedido, onMarcarDespachado }: PedidoCardProps) => {
  const formatearFechaHora = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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

  const extraerCiudad = (direccion: string) => {
    // Buscar patrones comunes de ciudad al final de la dirección
    const ciudadMatch = direccion.match(/,\s*([^,]+)$/);
    return ciudadMatch ? ciudadMatch[1] : 'Medellín';
  };

  const getEstadoBadge = () => {
    if (pedido.estado === 'despachado') {
      return (
        <Badge className="bg-success text-success-foreground text-xs">
          Despachado
        </Badge>
      );
    }
    return (
      <Badge className="bg-warning text-warning-foreground text-xs">
        Pendiente
      </Badge>
    );
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-primary">
              #{pedido.id.toString().padStart(3, '0')}
            </h3>
            {getEstadoBadge()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
            <Clock className="h-3 w-3" />
            <span className="font-medium">{formatearFechaHora(pedido.fecha_creacion)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">{pedido.nombre_cliente}</span>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold text-secondary">
                {extraerCiudad(pedido.direccion_entrega)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground flex-1">
              {pedido.direccion_entrega}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Productos:</span>
          </div>
          
          <div className="space-y-2 bg-muted/20 p-3 rounded-lg">
            {pedido.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    <span className="text-sm font-medium text-foreground">{item.producto}</span>
                  </div>
                  {item.precio_total && (
                    <div className="text-xs text-muted-foreground ml-3.5">
                      {formatearPrecio(item.precio_total)}
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  x{item.cantidad}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between bg-success/5 p-3 rounded-lg border border-success/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="font-semibold text-success">Total:</span>
            </div>
            <span className="text-xl font-bold text-success">
              {formatearPrecio(calcularTotal())}
            </span>
          </div>
        </div>

        {pedido.estado === 'pendiente' && (
          <Button
            onClick={() => onMarcarDespachado(pedido.id)}
            className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 transition-all duration-200 hover:shadow-lg"
          >
            Marcar como Despachado
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PedidoCard;