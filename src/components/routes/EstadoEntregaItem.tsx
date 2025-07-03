import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Check, 
  X, 
  MapPin,
  AlertTriangle,
  Truck,
  Package
} from 'lucide-react';

interface Pedido {
  id: number;
  nombre_cliente: string;
  direccion_entrega: string;
  ciudad_entrega?: string;
  estado: string;
  items: any[];
  prioridad: number;
  observaciones_logistica?: string;
}

interface EstadoEntregaItemProps {
  pedido: Pedido;
  onMarcarEntregado: () => void;
  onMarcarFallido: (razon: string) => void;
  readonly?: boolean;
}

export function EstadoEntregaItem({ 
  pedido, 
  onMarcarEntregado, 
  onMarcarFallido,
  readonly = false 
}: EstadoEntregaItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [razonFallo, setRazonFallo] = useState('');

  const getEstadoInfo = (estado: string) => {
    const estados = {
      'pendiente': { 
        icon: Clock, 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        label: 'Pendiente',
        variant: 'outline' as const
      },
      'asignado': { 
        icon: Package, 
        color: 'text-blue-500', 
        bg: 'bg-blue-100', 
        label: 'Asignado',
        variant: 'default' as const
      },
      'en_ruta': { 
        icon: Truck, 
        color: 'text-blue-600', 
        bg: 'bg-blue-100', 
        label: 'En Ruta',
        variant: 'default' as const
      },
      'entregado': { 
        icon: Check, 
        color: 'text-green-600', 
        bg: 'bg-green-100', 
        label: 'Entregado',
        variant: 'secondary' as const
      },
      'fallido': { 
        icon: X, 
        color: 'text-red-600', 
        bg: 'bg-red-100', 
        label: 'Fallido',
        variant: 'destructive' as const
      }
    };
    
    return estados[estado as keyof typeof estados] || estados.pendiente;
  };

  const getPrioridadBadge = (prioridad: number) => {
    if (prioridad >= 3) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Urgente
        </Badge>
      );
    }
    return null;
  };

  const handleMarcarFallido = () => {
    if (razonFallo.trim()) {
      onMarcarFallido(razonFallo);
      setDialogOpen(false);
      setRazonFallo('');
    }
  };

  const estadoInfo = getEstadoInfo(pedido.estado);
  const IconComponent = estadoInfo.icon;
  const prioridadBadge = getPrioridadBadge(pedido.prioridad);

  return (
    <div className={`
      border rounded-lg p-3 space-y-2 transition-all duration-200
      ${estadoInfo.bg} border-l-4 border-l-current
      ${estadoInfo.color}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">#{pedido.id}</span>
            <Badge variant={estadoInfo.variant} className="text-xs">
              <IconComponent className="h-3 w-3 mr-1" />
              {estadoInfo.label}
            </Badge>
            {prioridadBadge}
          </div>
          
          <div className="text-sm font-medium text-foreground">
            {pedido.nombre_cliente}
          </div>
          
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="leading-tight">
              {pedido.direccion_entrega}
              {pedido.ciudad_entrega && `, ${pedido.ciudad_entrega}`}
            </span>
          </div>

          {pedido.items && pedido.items.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {pedido.items.length} producto(s)
            </div>
          )}

          {pedido.observaciones_logistica && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              {pedido.observaciones_logistica}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        {!readonly && pedido.estado !== 'entregado' && pedido.estado !== 'fallido' && (
          <div className="flex gap-1 ml-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onMarcarEntregado}
              className="h-8 px-2"
            >
              <Check className="h-3 w-3" />
            </Button>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Marcar como Fallido</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Pedido #{pedido.id} - {pedido.nombre_cliente}
                    </p>
                    <p className="text-sm">
                      Explica el motivo por el cual no se pudo entregar:
                    </p>
                  </div>
                  
                  <Textarea
                    placeholder="Ej: Cliente no se encontraba, dirección incorrecta, etc."
                    value={razonFallo}
                    onChange={(e) => setRazonFallo(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleMarcarFallido}
                    disabled={!razonFallo.trim()}
                  >
                    Marcar como Fallido
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}