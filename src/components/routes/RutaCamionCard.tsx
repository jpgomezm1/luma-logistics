import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EstadoEntregaItem } from './EstadoEntregaItem';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RutaCompleta } from '@/pages/RoutesManagement';
import { 
  Truck, 
  Phone, 
  MapPin, 
  Clock, 
  Package,
  Check,
  X
} from 'lucide-react';

interface RutaCamionCardProps {
  ruta: RutaCompleta;
  onUpdateStatus: (rutaId: number, status: string) => void;
  readonly?: boolean;
}

export function RutaCamionCard({ ruta, onUpdateStatus, readonly = false }: RutaCamionCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const capacidadUtilizada = (ruta.volumen_total_m3 / ruta.camion.capacidad_maxima_m3) * 100;
  const pedidosEntregados = ruta.pedidos.filter(p => p.estado === 'entregado').length;
  const progresoPedidos = ruta.pedidos.length > 0 ? (pedidosEntregados / ruta.pedidos.length) * 100 : 0;

  const getEstadoBadge = (estado: string) => {
    const estados = {
      'planificada': { variant: 'outline' as const, label: 'Planificada', icon: Clock },
      'en_curso': { variant: 'default' as const, label: 'En Curso', icon: Truck },
      'completada': { variant: 'secondary' as const, label: 'Completada', icon: Check }
    };
    
    const estadoInfo = estados[estado as keyof typeof estados] || estados.planificada;
    const IconComponent = estadoInfo.icon;
    
    return (
      <Badge variant={estadoInfo.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {estadoInfo.label}
      </Badge>
    );
  };

  const handleIniciarRuta = async () => {
    if (readonly) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase.functions.invoke('update-route-status', {
        body: {
          ruta_id: ruta.id,
          accion: 'iniciar_ruta'
        }
      });

      if (error) throw error;

      toast({
        title: "Ruta Iniciada",
        description: `La ruta del camión ${ruta.camion.codigo} ha sido iniciada`,
      });

      onUpdateStatus(ruta.id, 'en_curso');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinalizarRuta = async () => {
    if (readonly) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase.functions.invoke('update-route-status', {
        body: {
          ruta_id: ruta.id,
          accion: 'finalizar_ruta'
        }
      });

      if (error) throw error;

      toast({
        title: "Ruta Finalizada",
        description: `La ruta del camión ${ruta.camion.codigo} ha sido completada`,
      });

      onUpdateStatus(ruta.id, 'completada');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarcarEntregado = async (pedidoId: number) => {
    if (readonly) return;
    
    try {
      const { error } = await supabase.functions.invoke('update-route-status', {
        body: {
          ruta_id: ruta.id,
          accion: 'pedido_entregado',
          pedido_id: pedidoId
        }
      });

      if (error) throw error;

      toast({
        title: "Pedido Entregado",
        description: `El pedido #${pedidoId} ha sido marcado como entregado`,
      });

      onUpdateStatus(ruta.id, ruta.estado);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarcarFallido = async (pedidoId: number, razon: string) => {
    if (readonly) return;
    
    try {
      const { error } = await supabase.functions.invoke('update-route-status', {
        body: {
          ruta_id: ruta.id,
          accion: 'pedido_fallido',
          pedido_id: pedidoId,
          observaciones: razon
        }
      });

      if (error) throw error;

      toast({
        title: "Pedido Marcado como Fallido",
        description: `El pedido #${pedidoId} ha sido marcado como fallido`,
        variant: "destructive",
      });

      onUpdateStatus(ruta.id, ruta.estado);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {ruta.camion.codigo}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{ruta.camion.conductor_nombre}</span>
              {ruta.camion.conductor_telefono && (
                <a 
                  href={`tel:${ruta.camion.conductor_telefono}`}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Phone className="h-3 w-3" />
                  {ruta.camion.conductor_telefono}
                </a>
              )}
            </div>
          </div>
          {getEstadoBadge(ruta.estado)}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Capacidad</span>
              <span>{Math.round(capacidadUtilizada)}%</span>
            </div>
            <Progress 
              value={capacidadUtilizada} 
              className="h-2"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Progreso</span>
              <span>{pedidosEntregados}/{ruta.pedidos.length}</span>
            </div>
            <Progress 
              value={progresoPedidos} 
              className="h-2"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información de ruta */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>Inicio: {ruta.hora_inicio}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{ruta.distancia_total_km}km</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span>{ruta.volumen_total_m3}m³</span>
          </div>
        </div>

        {/* Timeline de entregas */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Entregas del día</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {ruta.pedidos.map((pedido) => (
              <EstadoEntregaItem
                key={pedido.id}
                pedido={pedido}
                onMarcarEntregado={() => handleMarcarEntregado(pedido.id)}
                onMarcarFallido={(razon) => handleMarcarFallido(pedido.id, razon)}
                readonly={readonly}
              />
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        {!readonly && (
          <div className="flex gap-2 pt-2 border-t">
            {ruta.estado === 'planificada' && (
              <Button
                onClick={handleIniciarRuta}
                size="sm"
                disabled={isUpdating}
                className="flex-1"
              >
                <Truck className="h-4 w-4 mr-2" />
                Iniciar Ruta
              </Button>
            )}
            
            {ruta.estado === 'en_curso' && (
              <Button
                onClick={handleFinalizarRuta}
                size="sm"
                disabled={isUpdating}
                variant="outline"
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Finalizar Ruta
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${ruta.camion.conductor_telefono}`, '_self')}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}