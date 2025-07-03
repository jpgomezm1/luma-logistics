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
  X,
  Play,
  Pause,
  User,
  Route,
  Timer,
  Eye,
  MoreVertical
} from 'lucide-react';

interface RutaCamionCardProps {
  ruta: RutaCompleta;
  viewMode?: 'grid' | 'list';
  onUpdateStatus: (rutaId: number, status: string) => void;
  onViewDetails?: (rutaId: number) => void;
  readonly?: boolean;
}

export function RutaCamionCard({ ruta, viewMode = 'grid', onUpdateStatus, onViewDetails, readonly = false }: RutaCamionCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const capacidadUtilizada = (ruta.volumen_total_m3 / ruta.camion.capacidad_maxima_m3) * 100;
  const pedidosEntregados = ruta.pedidos.filter(p => p.estado === 'entregado').length;
  const progresoPedidos = ruta.pedidos.length > 0 ? (pedidosEntregados / ruta.pedidos.length) * 100 : 0;

  const getEstadoConfig = (estado: string) => {
    const estados = {
      'planificada': { 
        variant: 'secondary' as const, 
        label: 'Planificada', 
        icon: Clock,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-400'
      },
      'en_curso': { 
        variant: 'default' as const, 
        label: 'En Curso', 
        icon: Play,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500 animate-pulse'
      },
      'completada': { 
        variant: 'secondary' as const, 
        label: 'Completada', 
        icon: Check,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      },
      'pausada': { 
        variant: 'destructive' as const, 
        label: 'Pausada', 
        icon: Pause,
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        dot: 'bg-orange-500'
      }
    };
    
    return estados[estado as keyof typeof estados] || estados.planificada;
  };

  const estadoConfig = getEstadoConfig(ruta.estado);
  const IconComponent = estadoConfig.icon;

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

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            {/* Avatar y estado */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
                <Truck className="w-8 h-8 text-indigo-600" />
              </div>
              <div className={`absolute -top-1 -right-1 w-5 h-5 ${estadoConfig.dot} rounded-full border-2 border-white shadow-sm`}></div>
            </div>

            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-slate-900">{ruta.camion.codigo}</h3>
                <Badge className={`${estadoConfig.color} border font-medium px-3 py-1`}>
                  <IconComponent className="w-3 h-3 mr-1" />
                  {estadoConfig.label}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{ruta.camion.conductor_nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{ruta.pedidos.length} pedidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{ruta.distancia_total_km} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{ruta.hora_inicio}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Capacidad</span>
                    <span className="font-bold text-slate-800">{Math.round(capacidadUtilizada)}%</span>
                  </div>
                  <Progress 
                    value={capacidadUtilizada} 
                    className="h-3 bg-slate-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Progreso</span>
                    <span className="font-bold text-slate-800">{pedidosEntregados}/{ruta.pedidos.length}</span>
                  </div>
                  <Progress 
                    value={progresoPedidos} 
                    className="h-3 bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              {!readonly && (
                <>
                  {ruta.estado === 'planificada' && (
                    <Button
                      onClick={handleIniciarRuta}
                      disabled={isUpdating}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg px-6"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                  
                  {ruta.estado === 'en_curso' && (
                    <Button
                      onClick={handleFinalizarRuta}
                      disabled={isUpdating}
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-6"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Finalizar
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`tel:${ruta.camion.conductor_telefono}`, '_self')}
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewDetails?.(ruta.id)}
                className="text-slate-500 hover:text-slate-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Detalles expandibles */}
          {showDetails && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Entregas programadas
                </h4>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
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
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Vista Grid (original mejorada)
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border border-slate-200/60 bg-white/90 backdrop-blur-sm hover:bg-white">
      <CardHeader className="pb-4 relative">
        <div className="absolute top-4 right-4">
          <div className={`w-3 h-3 ${estadoConfig.dot} rounded-full shadow-sm`}></div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              <Truck className="w-7 h-7 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                {ruta.camion.codigo}
              </CardTitle>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{ruta.camion.conductor_nombre}</span>
                </div>
                {ruta.camion.conductor_telefono && (
                  <a 
                    href={`tel:${ruta.camion.conductor_telefono}`}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{ruta.camion.conductor_telefono}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <Badge className={`${estadoConfig.color} border font-medium px-3 py-1.5 w-fit`}>
            <IconComponent className="w-3 h-3 mr-1.5" />
            {estadoConfig.label}
          </Badge>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-4 pt-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Capacidad</span>
              <span className="font-bold text-slate-800">{Math.round(capacidadUtilizada)}%</span>
            </div>
            <Progress 
              value={capacidadUtilizada} 
              className="h-2.5 bg-slate-100"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Progreso</span>
              <span className="font-bold text-slate-800">{pedidosEntregados}/{ruta.pedidos.length}</span>
            </div>
            <Progress 
              value={progresoPedidos} 
              className="h-2.5 bg-slate-100"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Información de ruta */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
            <p className="text-xs text-slate-600 font-medium">{ruta.hora_inicio}</p>
            <p className="text-xs text-slate-500">Inicio</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <MapPin className="w-4 h-4 text-slate-500 mx-auto mb-1" />
            <p className="text-xs text-slate-600 font-medium">{ruta.distancia_total_km}km</p>
            <p className="text-xs text-slate-500">Distancia</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <Package className="w-4 h-4 text-slate-500 mx-auto mb-1" />
            <p className="text-xs text-slate-600 font-medium">{ruta.volumen_total_m3}m³</p>
            <p className="text-xs text-slate-500">Volumen</p>
          </div>
        </div>

        {/* Timeline de entregas - Vista compacta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800">Entregas</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-slate-500 hover:text-slate-700 p-1"
            >
              {showDetails ? 'Ocultar' : 'Ver detalles'}
            </Button>
          </div>
          
          {!showDetails ? (
            <div className="space-y-1">
              {ruta.pedidos.slice(0, 3).map((pedido, index) => (
                <div key={pedido.id} className="flex items-center gap-3 text-xs p-2 bg-slate-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    pedido.estado === 'entregado' ? 'bg-emerald-500' : 
                    pedido.estado === 'fallido' ? 'bg-red-500' : 'bg-slate-300'
                  }`}></div>
                  <span className="flex-1 truncate font-medium text-slate-700">
                    {pedido.nombre_cliente || `Pedido #${pedido.id}`}
                  </span>
                </div>
              ))}
              {ruta.pedidos.length > 3 && (
                <div className="text-center py-1">
                  <span className="text-xs text-slate-500">
                    +{ruta.pedidos.length - 3} entregas más
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
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
          )}
        </div>

        {/* Botones de acción */}
        {!readonly && (
          <div className="pt-4 border-t border-slate-200/70 space-y-2">
            {ruta.estado === 'planificada' && (
              <Button
                onClick={handleIniciarRuta}
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg group-hover:shadow-xl transition-all duration-300"
              >
                <Play className="w-4 h-4 mr-2" />
                {isUpdating ? 'Iniciando...' : 'Iniciar Ruta'}
              </Button>
            )}
            
            {ruta.estado === 'en_curso' && (
              <Button
                onClick={handleFinalizarRuta}
                disabled={isUpdating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg"
              >
                <Check className="w-4 h-4 mr-2" />
                {isUpdating ? 'Finalizando...' : 'Finalizar Ruta'}
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(`tel:${ruta.camion.conductor_telefono}`, '_self')}
                className="flex-1 border-slate-200 hover:bg-slate-50"
              >
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onViewDetails?.(ruta.id)}
                className="border-slate-200 hover:bg-slate-50"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}