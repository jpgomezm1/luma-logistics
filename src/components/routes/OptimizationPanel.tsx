import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RutaCompleta } from '@/pages/RoutesManagement';
import { 
  Truck, 
  RefreshCw, 
  TrendingUp, 
  Clock,
  MapPin,
  Package,
  Zap,
  Brain,
  Target,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Timer,
  Fuel,
  Award,
  Activity,
  ChevronRight,
  Gauge,
  Route
} from 'lucide-react';

interface OptimizationPanelProps {
  rutas: RutaCompleta[];
  onOptimize: () => void;
  selectedDate: string;
}

interface OptimizacionSugerencia {
  camion_codigo: string;
  tipo: 'consolidacion' | 'reordenamiento' | 'capacidad' | 'tiempo';
  prioridad: 'alta' | 'media' | 'baja';
  mejoras: {
    ahorro_km: number;
    ahorro_tiempo: number;
    mejor_utilizacion: number;
    ahorro_combustible?: number;
  };
  razon: string;
  impacto_estimado: number;
}

interface MetricasOptimizacion {
  eficiencia_global: number;
  potencial_mejora: number;
  rutas_optimizables: number;
  ahorro_estimado_km: number;
  ahorro_estimado_tiempo: number;
}

export function OptimizationPanel({ rutas, onOptimize, selectedDate }: OptimizationPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [sugerencias, setSugerencias] = useState<OptimizacionSugerencia[]>([]);
  const [metricas, setMetricas] = useState<MetricasOptimizacion | null>(null);
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'analisis' | 'sugerencias' | 'individual'>('analisis');

  useEffect(() => {
    if (rutas.length > 0) {
      calcularMetricas();
    }
  }, [rutas]);

  const calcularMetricas = () => {
    const rutasOptimizables = rutas.filter(r => r.estado === 'planificada');
    const utilizacionPromedio = rutas.length > 0 
      ? rutas.reduce((sum, r) => sum + ((r.volumen_total_m3 / r.camion.capacidad_maxima_m3) * 100), 0) / rutas.length
      : 0;

    const potencialMejora = Math.max(0, 85 - utilizacionPromedio);
    const ahorroEstimadoKm = rutasOptimizables.reduce((sum, r) => sum + (r.distancia_total_km * 0.15), 0);
    const ahorroEstimadoTiempo = rutasOptimizables.reduce((sum, r) => sum + (r.tiempo_estimado_horas * 0.2), 0);

    setMetricas({
      eficiencia_global: utilizacionPromedio,
      potencial_mejora: potencialMejora,
      rutas_optimizables: rutasOptimizables.length,
      ahorro_estimado_km: ahorroEstimadoKm,
      ahorro_estimado_tiempo: ahorroEstimadoTiempo
    });
  };

  const getTipoIcon = (tipo: string) => {
    const iconos = {
      'consolidacion': Package,
      'reordenamiento': Route,
      'capacidad': Gauge,
      'tiempo': Timer
    };
    return iconos[tipo as keyof typeof iconos] || AlertCircle;
  };

  const getPrioridadColor = (prioridad: string) => {
    const colores = {
      'alta': 'bg-red-50 text-red-700 border-red-200',
      'media': 'bg-amber-50 text-amber-700 border-amber-200',
      'baja': 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colores[prioridad as keyof typeof colores] || colores.baja;
  };

  const handleOptimizeRoute = async (rutaId: number) => {
    const ruta = rutas.find(r => r.id === rutaId);
    if (!ruta) return;

    try {
      setIsOptimizing(true);

      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id')
        .eq('ruta_entrega_id', rutaId);

      if (!pedidos || pedidos.length === 0) {
        toast({
          title: "Sin pedidos",
          description: "Esta ruta no tiene pedidos asignados",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('optimize-routes', {
        body: {
          bodega: ruta.camion.codigo.split('-')[0],
          fecha_planificacion: ruta.fecha_programada,
          camiones_disponibles: [ruta.camion.codigo],
          pedidos_incluir: pedidos.map(p => p.id)
        }
      });

      if (error) throw error;

      toast({
        title: "✨ Optimización Completada",
        description: `Ruta del camión ${ruta.camion.codigo} optimizada exitosamente`,
      });

      onOptimize();
      setLastOptimization(new Date());
    } catch (error: any) {
      toast({
        title: "Error en Optimización",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      setIsAnalyzing(true);
      
      const nuevasSugerencias: OptimizacionSugerencia[] = [];
      
      for (const ruta of rutas.filter(r => r.estado === 'planificada')) {
        const utilizacion = (ruta.volumen_total_m3 / ruta.camion.capacidad_maxima_m3) * 100;
        const kmPorPedido = ruta.pedidos.length > 0 ? ruta.distancia_total_km / ruta.pedidos.length : 0;
        
        if (utilizacion < 60) {
          nuevasSugerencias.push({
            camion_codigo: ruta.camion.codigo,
            tipo: 'consolidacion',
            prioridad: utilizacion < 40 ? 'alta' : 'media',
            mejoras: {
              ahorro_km: Math.round(ruta.distancia_total_km * 0.25),
              ahorro_tiempo: Math.round(ruta.tiempo_estimado_horas * 60 * 0.3),
              mejor_utilizacion: Math.round((80 - utilizacion) * 10) / 10,
              ahorro_combustible: Math.round(ruta.distancia_total_km * 0.25 * 0.12)
            },
            razon: utilizacion < 40 
              ? "Capacidad muy subutilizada - consolidar con otras rutas"
              : "Oportunidad de consolidación para mejorar eficiencia",
            impacto_estimado: utilizacion < 40 ? 85 : 65
          });
        } else if (kmPorPedido > 8) {
          nuevasSugerencias.push({
            camion_codigo: ruta.camion.codigo,
            tipo: 'reordenamiento',
            prioridad: 'media',
            mejoras: {
              ahorro_km: Math.round(ruta.distancia_total_km * 0.15),
              ahorro_tiempo: Math.round(ruta.tiempo_estimado_horas * 60 * 0.2),
              mejor_utilizacion: 5,
              ahorro_combustible: Math.round(ruta.distancia_total_km * 0.15 * 0.12)
            },
            razon: "Secuencia de paradas subóptima - reordenar entregas",
            impacto_estimado: 50
          });
        } else if (ruta.tiempo_estimado_horas > 8) {
          nuevasSugerencias.push({
            camion_codigo: ruta.camion.codigo,
            tipo: 'tiempo',
            prioridad: 'baja',
            mejoras: {
              ahorro_km: Math.round(ruta.distancia_total_km * 0.08),
              ahorro_tiempo: Math.round(ruta.tiempo_estimado_horas * 60 * 0.15),
              mejor_utilizacion: 2,
              ahorro_combustible: Math.round(ruta.distancia_total_km * 0.08 * 0.12)
            },
            razon: "Jornada extensa - optimizar tiempos de entrega",
            impacto_estimado: 30
          });
        }
      }
      
      // Ordenar por impacto estimado
      nuevasSugerencias.sort((a, b) => b.impacto_estimado - a.impacto_estimado);
      
      setSugerencias(nuevasSugerencias);
      setLastOptimization(new Date());
      
      if (nuevasSugerencias.length === 0) {
        toast({
          title: "🎯 Rutas Optimizadas",
          description: "Las rutas actuales ya están bien optimizadas",
        });
      } else {
        toast({
          title: "🔍 Análisis Completado",
          description: `Se encontraron ${nuevasSugerencias.length} oportunidades de mejora`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error en Análisis",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const rutasOptimizables = rutas.filter(r => r.estado === 'planificada');

  return (
    <div className="space-y-6">
      {/* Panel principal de optimización IA */}
      <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-indigo-200/50 shadow-lg">
        <CardHeader className="pb-4 bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <span>Optimización IA</span>
              <p className="text-sm text-indigo-100 font-normal mt-1">
                Análisis inteligente de rutas
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Métricas principales */}
          {metricas && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">Eficiencia Global</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {Math.round(metricas.eficiencia_global)}%
                    </p>
                  </div>
                </div>
                <Progress value={metricas.eficiencia_global} className="mt-3 h-2" />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Potencial Mejora</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {Math.round(metricas.potencial_mejora)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-600">
                  {metricas.rutas_optimizables} rutas disponibles
                </div>
              </div>
            </div>
          )}

          {/* Ahorros estimados */}
          {metricas && metricas.potencial_mejora > 5 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
              <h4 className="text-amber-800 font-semibold mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Ahorros Potenciales
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-700">
                    <MapPin className="w-3 h-3" />
                    <span className="font-bold">{Math.round(metricas.ahorro_estimado_km)}km</span>
                  </div>
                  <p className="text-amber-600 text-xs">Distancia</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-700">
                    <Timer className="w-3 h-3" />
                    <span className="font-bold">{Math.round(metricas.ahorro_estimado_tiempo)}h</span>
                  </div>
                  <p className="text-amber-600 text-xs">Tiempo</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-700">
                    <Fuel className="w-3 h-3" />
                    <span className="font-bold">${Math.round(metricas.ahorro_estimado_km * 0.12 * 4500)}</span>
                  </div>
                  <p className="text-amber-600 text-xs">Combustible</p>
                </div>
              </div>
            </div>
          )}

          {/* Controles principales */}
          <div className="space-y-3">
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isAnalyzing || rutasOptimizables.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 shadow-lg"
              size="lg"
            >
              <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analizando rutas...' : 'Generar Sugerencias IA'}
            </Button>
            
            {lastOptimization && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Activity className="w-4 h-4" />
                <span>Último análisis: {lastOptimization.toLocaleTimeString('es-CO')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sugerencias de optimización */}
      {sugerencias.length > 0 && (
        <Card className="overflow-hidden border border-slate-200/60 shadow-lg">
          <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Sugerencias Inteligentes
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {sugerencias.length} mejoras
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              {sugerencias.map((sugerencia, index) => {
                const TipoIcon = getTipoIcon(sugerencia.tipo);
                
                return (
                  <div
                    key={index}
                    className="group p-4 border border-slate-200 rounded-xl hover:shadow-lg transition-all duration-300 bg-white hover:bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                          <TipoIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-4 w-4 text-slate-600" />
                            <span className="font-semibold text-slate-800">
                              {sugerencia.camion_codigo}
                            </span>
                            <Badge className={`${getPrioridadColor(sugerencia.prioridad)} text-xs border`}>
                              {sugerencia.prioridad}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {sugerencia.razon}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          const ruta = rutas.find(r => r.camion.codigo === sugerencia.camion_codigo);
                          if (ruta) handleOptimizeRoute(ruta.id);
                        }}
                        disabled={isOptimizing}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm group-hover:shadow-md transition-all duration-300"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                    
                    {/* Métricas de mejora */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-3 bg-slate-50/70 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-emerald-700 mb-1">
                          <MapPin className="h-3 w-3" />
                          <span className="font-bold text-sm">-{sugerencia.mejoras.ahorro_km}km</span>
                        </div>
                        <p className="text-xs text-slate-600">Distancia</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                          <Clock className="h-3 w-3" />
                          <span className="font-bold text-sm">-{sugerencia.mejoras.ahorro_tiempo}min</span>
                        </div>
                        <p className="text-xs text-slate-600">Tiempo</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-purple-700 mb-1">
                          <Package className="h-3 w-3" />
                          <span className="font-bold text-sm">+{sugerencia.mejoras.mejor_utilizacion}%</span>
                        </div>
                        <p className="text-xs text-slate-600">Capacidad</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-700 mb-1">
                          <Target className="h-3 w-3" />
                          <span className="font-bold text-sm">{sugerencia.impacto_estimado}%</span>
                        </div>
                        <p className="text-xs text-slate-600">Impacto</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimización individual */}
      {rutasOptimizables.length > 0 && (
        <Card className="border border-slate-200/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-slate-600" />
              Optimización Individual
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {rutasOptimizables.map((ruta) => {
              const utilizacion = (ruta.volumen_total_m3 / ruta.camion.capacidad_maxima_m3) * 100;
              
              return (
                <div
                  key={ruta.id}
                  className="group flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-300 bg-white hover:bg-slate-50/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl flex items-center justify-center">
                      <Truck className="h-5 w-5 text-slate-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-slate-800">{ruta.camion.codigo}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs border ${
                            utilizacion >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            utilizacion >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {Math.round(utilizacion)}% capacidad
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>{ruta.pedidos.length} pedidos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{ruta.distancia_total_km}km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{ruta.tiempo_estimado_horas}h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOptimizeRoute(ruta.id)}
                    disabled={isOptimizing}
                    className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 group-hover:shadow-sm transition-all duration-300"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
                    Optimizar
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Estado cuando no hay rutas */}
      {rutasOptimizables.length === 0 && (
        <Card className="border border-slate-200/60">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No hay rutas para optimizar
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Todas las rutas están en curso o completadas. La optimización estará disponible para nuevas rutas planificadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}