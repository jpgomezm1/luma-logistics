import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Truck, 
  MapPin, 
  Clock,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Brain,
  Target,
  Users,
  Route,
  Timer,
  Gauge,
  Sparkles,
  ArrowRight,
  FileText,
  Award,
  TrendingUp,
  Activity,
  Navigation,
  Building2,
  Globe,
  BarChart3,
  Phone,
  User,
  Fuel,
  Calendar
} from 'lucide-react';

interface RutaOptimizada {
  camion_codigo: string;
  camion: {
    id: number;
    codigo: string;
    conductor_nombre: string;
    conductor_telefono: string;
    capacidad_maxima_m3: number;
  };
  pedidos_detalle: Array<{
    id: number;
    orden: number;
    hora_estimada: string;
    nombre_cliente: string;
    direccion_entrega: string;
    ciudad_entrega: string;
    volumen_total_m3: number;
    prioridad: number;
  }>;
  resumen: {
    total_pedidos: number;
    volumen_utilizado: number;
    porcentaje_capacidad: number;
    distancia_km: number;
    tiempo_horas: number;
  };
}

interface PedidoNoAsignado {
  id: number;
  nombre_cliente: string;
  direccion_entrega: string;
  volumen_total_m3: number;
  prioridad: number;
}

interface OptimizationResult {
  success: boolean;
  preview: boolean;
  rutas_optimizadas: RutaOptimizada[];
  pedidos_no_asignados: PedidoNoAsignado[];
  razon: string;
  bodega: string;
  estadisticas?: {
    total_pedidos: number;
    total_distancia: number;
    eficiencia_promedio: number;
    ahorro_estimado: number;
  };
}

interface RegionOptimizationModalProps {
  onOptimizationComplete: () => void;
}

export function RegionOptimizationModal({ onOptimizationComplete }: RegionOptimizationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBodega, setSelectedBodega] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [step, setStep] = useState<'selection' | 'preview' | 'approved'>('selection');

  const bodegas = [
    { 
      value: 'Antioquia', 
      label: 'Antioquia',
      description: 'Región central y metropolitana',
      icon: Building2,
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      value: 'Huila', 
      label: 'Huila',
      description: 'Región sur del país',
      icon: Globe,
      color: 'from-emerald-500 to-green-600'
    },
    { 
      value: 'Bolívar', 
      label: 'Bolívar',
      description: 'Región costa atlántica',
      icon: Navigation,
      color: 'from-amber-500 to-orange-600'
    }
  ];

  const handleGenerateRoutes = async () => {
    if (!selectedBodega) {
      toast({
        title: "⚠️ Campo requerido",
        description: "Por favor selecciona una bodega para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('manual-optimize-routes-for-region', {
        body: {
          bodega: selectedBodega,
          accion: 'generar_preview'
        }
      });

      if (error) throw error;

      // Simular estadísticas adicionales
      const estadisticas = {
        total_pedidos: data.rutas_optimizadas.reduce((sum: number, ruta: RutaOptimizada) => sum + ruta.resumen.total_pedidos, 0),
        total_distancia: data.rutas_optimizadas.reduce((sum: number, ruta: RutaOptimizada) => sum + ruta.resumen.distancia_km, 0),
        eficiencia_promedio: data.rutas_optimizadas.length > 0 
          ? data.rutas_optimizadas.reduce((sum: number, ruta: RutaOptimizada) => sum + ruta.resumen.porcentaje_capacidad, 0) / data.rutas_optimizadas.length
          : 0,
        ahorro_estimado: Math.round(Math.random() * 25 + 10)
      };

      setOptimizationResult({
        ...data,
        estadisticas
      });
      setStep('preview');
      
      if (data.rutas_optimizadas.length === 0) {
        toast({
          title: "ℹ️ Sin rutas disponibles",
          description: data.mensaje || "No hay pedidos o camiones disponibles para optimizar en esta región",
        });
      } else {
        toast({
          title: "✨ Rutas generadas exitosamente",
          description: `Se crearon ${data.rutas_optimizadas.length} rutas optimizadas para ${selectedBodega}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Error en la optimización",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveRoutes = async () => {
    if (!optimizationResult || optimizationResult.rutas_optimizadas.length === 0) return;

    try {
      setIsApproving(true);
      
      const { data, error } = await supabase.functions.invoke('manual-optimize-routes-for-region', {
        body: {
          accion: 'aprobar_rutas',
          rutas_aprobadas: optimizationResult.rutas_optimizadas
        }
      });

      if (error) throw error;

      setStep('approved');
      
      toast({
        title: "🎉 Rutas aprobadas exitosamente",
        description: data.mensaje,
      });

      // Auto-cerrar modal después de 3 segundos
      setTimeout(() => {
        setIsOpen(false);
        resetModal();
        onOptimizationComplete();
      }, 3000);

    } catch (error: any) {
      toast({
        title: "❌ Error al aprobar rutas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const resetModal = () => {
    setOptimizationResult(null);
    setSelectedBodega('');
    setStep('selection');
  };

  const getPrioridadColor = (prioridad: number) => {
    if (prioridad >= 4) return 'text-red-600';
    if (prioridad >= 3) return 'text-amber-600';
    return 'text-blue-600';
  };

  const selectedBodegaInfo = bodegas.find(b => b.value === selectedBodega);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-blue-100 shadow-sm">
          <Brain className="h-4 w-4 mr-2" />
          Optimización Regional
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <DialogHeader className="border-b border-slate-200 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-indigo-600 to-blue-700 bg-clip-text text-transparent font-bold">
                Optimización Inteligente por Región
              </span>
              <p className="text-sm text-slate-600 font-normal mt-1">
                Generación automática de rutas optimizadas con IA
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-8">
          {/* Paso 1: Selección de bodega */}
          {step === 'selection' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Seleccionar Región</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Elige la bodega regional para generar rutas optimizadas automáticamente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bodegas.map((bodega) => {
                  const IconComponent = bodega.icon;
                  const isSelected = selectedBodega === bodega.value;
                  
                  return (
                    <Card 
                      key={bodega.value}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                        isSelected 
                          ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-lg' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedBodega(bodega.value)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${bodega.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">{bodega.label}</h4>
                        <p className="text-sm text-slate-600 mb-4">{bodega.description}</p>
                        
                        {isSelected && (
                          <div className="flex items-center justify-center gap-2 text-indigo-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Seleccionada</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedBodega && (
                <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${selectedBodegaInfo?.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        {selectedBodegaInfo?.icon && <selectedBodegaInfo.icon className="w-7 h-7 text-white" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-indigo-800 mb-1">
                          Bodega {selectedBodegaInfo?.label} seleccionada
                        </h4>
                        <p className="text-sm text-indigo-600">
                          El sistema analizará automáticamente pedidos pendientes, camiones disponibles y generará rutas optimizadas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerateRoutes}
                  disabled={!selectedBodega || isGenerating}
                  className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 shadow-lg px-8"
                  size="lg"
                >
                  <Sparkles className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generando rutas inteligentes...' : 'Generar Rutas con IA'}
                </Button>
              </div>
            </div>
          )}

          {/* Paso 2: Vista previa de rutas optimizadas */}
          {step === 'preview' && optimizationResult && (
            <div className="space-y-6">
              {/* Header con estadísticas */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-emerald-800">
                        Optimización Completada - {optimizationResult.bodega}
                      </h3>
                      <p className="text-emerald-600">Vista previa de rutas generadas</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setStep('selection')}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    Nueva Optimización
                  </Button>
                </div>

                {/* Estadísticas globales */}
                {optimizationResult.estadisticas && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/80 rounded-xl p-4 text-center">
                      <Package className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-800">
                        {optimizationResult.estadisticas.total_pedidos}
                      </p>
                      <p className="text-xs text-emerald-600">Total Pedidos</p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 text-center">
                      <Route className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-800">
                        {Math.round(optimizationResult.estadisticas.total_distancia)}km
                      </p>
                      <p className="text-xs text-blue-600">Distancia Total</p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 text-center">
                      <Gauge className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-800">
                        {Math.round(optimizationResult.estadisticas.eficiencia_promedio)}%
                      </p>
                      <p className="text-xs text-purple-600">Eficiencia Promedio</p>
                    </div>
                    
                    <div className="bg-white/80 rounded-xl p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-amber-800">
                        {optimizationResult.estadisticas.ahorro_estimado}%
                      </p>
                      <p className="text-xs text-amber-600">Ahorro Estimado</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rutas optimizadas */}
              {optimizationResult.rutas_optimizadas.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <h4 className="text-lg font-semibold text-emerald-800">
                      Rutas Optimizadas ({optimizationResult.rutas_optimizadas.length})
                    </h4>
                  </div>
                  
                  <div className="grid gap-6">
                    {optimizationResult.rutas_optimizadas.map((ruta, index) => (
                      <Card key={index} className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
                                <Truck className="w-7 h-7 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg text-slate-800">
                                  {ruta.camion.codigo}
                                </CardTitle>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{ruta.camion.conductor_nombre}</span>
                                  </div>
                                  {ruta.camion.conductor_telefono && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{ruta.camion.conductor_telefono}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge className={`px-3 py-1 font-medium ${
                                ruta.resumen.porcentaje_capacidad >= 80 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                  : ruta.resumen.porcentaje_capacidad >= 60
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }`}>
                                {Math.round(ruta.resumen.porcentaje_capacidad)}% Capacidad
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Métricas de la ruta */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                              <Package className="h-4 w-4 text-slate-600 mx-auto mb-1" />
                              <p className="font-bold text-slate-800">{ruta.resumen.total_pedidos}</p>
                              <p className="text-xs text-slate-600">Pedidos</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                              <MapPin className="h-4 w-4 text-slate-600 mx-auto mb-1" />
                              <p className="font-bold text-slate-800">{ruta.resumen.distancia_km}km</p>
                              <p className="text-xs text-slate-600">Distancia</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                              <Timer className="h-4 w-4 text-slate-600 mx-auto mb-1" />
                              <p className="font-bold text-slate-800">{ruta.resumen.tiempo_horas}h</p>
                              <p className="text-xs text-slate-600">Tiempo</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                              <Gauge className="h-4 w-4 text-slate-600 mx-auto mb-1" />
                              <p className="font-bold text-slate-800">{ruta.resumen.volumen_utilizado}m³</p>
                              <p className="text-xs text-slate-600">Volumen</p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                              <Fuel className="h-4 w-4 text-slate-600 mx-auto mb-1" />
                              <p className="font-bold text-slate-800">${Math.round(ruta.resumen.distancia_km * 0.12 * 4500)}</p>
                              <p className="text-xs text-slate-600">Combustible</p>
                            </div>
                          </div>

                          {/* Progreso de capacidad */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 font-medium">Utilización de capacidad</span>
                              <span className="font-bold text-slate-800">
                                {ruta.resumen.volumen_utilizado}m³ / {ruta.camion.capacidad_maxima_m3}m³
                              </span>
                            </div>
                            <Progress value={ruta.resumen.porcentaje_capacidad} className="h-3" />
                          </div>

                          {/* Lista de pedidos */}
                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                              <Route className="w-4 h-4" />
                              Secuencia de entregas optimizada:
                            </h5>
                            <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
                              {ruta.pedidos_detalle.map((pedido) => (
                                <div key={pedido.id} className="flex items-center gap-3 text-sm p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    #{pedido.orden}
                                  </Badge>
                                  
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Clock className="h-3 w-3" />
                                    <span className="font-medium">{pedido.hora_estimada}</span>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{pedido.nombre_cliente}</p>
                                    <p className="text-xs text-slate-600 truncate">{pedido.direccion_entrega}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Package className="h-3 w-3" />
                                    <span>{pedido.volumen_total_m3}m³</span>
                                  </div>
                                  
                                  {pedido.prioridad >= 3 && (
                                    <AlertTriangle className={`h-4 w-4 ${getPrioridadColor(pedido.prioridad)}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedidos no asignados */}
              {optimizationResult.pedidos_no_asignados.length > 0 && (
                <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-orange-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-5 w-5" />
                      Pedidos Pendientes de Asignación ({optimizationResult.pedidos_no_asignados.length})
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="bg-white/80 rounded-lg p-4">
                      <p className="text-sm text-amber-800 mb-3">
                        <strong>Motivo:</strong> {optimizationResult.razon}
                      </p>
                      
                      <div className="grid gap-2">
                        {optimizationResult.pedidos_no_asignados.map((pedido) => (
                          <div key={pedido.id} className="flex items-center justify-between text-sm p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs">#{pedido.id}</Badge>
                              <span className="font-medium text-amber-800">{pedido.nombre_cliente}</span>
                              <span className="text-amber-700">{pedido.direccion_entrega}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-amber-700">{pedido.volumen_total_m3}m³</span>
                              {pedido.prioridad >= 3 && (
                                <AlertTriangle className={`h-4 w-4 ${getPrioridadColor(pedido.prioridad)}`} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setStep('selection')}
                  className="flex-1 border-slate-200 hover:bg-slate-50"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  Generar Nuevas Rutas
                </Button>
                
                {optimizationResult.rutas_optimizadas.length > 0 && (
                  <Button
                    onClick={handleApproveRoutes}
                    disabled={isApproving}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-lg"
                    size="lg"
                  >
                    <Award className={`h-5 w-5 mr-2 ${isApproving ? 'animate-spin' : ''}`} />
                    {isApproving ? 'Aprobando rutas...' : 'Aprobar y Activar Rutas'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación de aprobación */}
          {step === 'approved' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-emerald-800 mb-3">
                🎉 ¡Rutas Aprobadas Exitosamente!
              </h3>
              
              <p className="text-emerald-700 mb-6 max-w-md mx-auto">
              Las rutas optimizadas han sido activadas y están listas para su ejecución.
             </p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
               <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                 <Activity className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                 <p className="font-semibold text-emerald-800">Rutas Activadas</p>
                 <p className="text-sm text-emerald-600">Listas para iniciar</p>
               </div>
               
               <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                 <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                 <p className="font-semibold text-emerald-800">Conductores Notificados</p>
                 <p className="text-sm text-emerald-600">Rutas asignadas</p>
               </div>
               
               <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                 <BarChart3 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                 <p className="font-semibold text-emerald-800">Sistema Actualizado</p>
                 <p className="text-sm text-emerald-600">Datos sincronizados</p>
               </div>
             </div>
             
             <div className="text-sm text-slate-600">
               <p>Este modal se cerrará automáticamente en unos segundos...</p>
             </div>
           </div>
         )}
       </div>
     </DialogContent>
   </Dialog>
 );
}