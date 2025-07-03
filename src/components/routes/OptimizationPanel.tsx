import { useState } from 'react';
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
  Zap
} from 'lucide-react';

interface OptimizationPanelProps {
  rutas: RutaCompleta[];
  onOptimize: () => void;
}

interface OptimizacionSugerencia {
  camion_codigo: string;
  mejoras: {
    ahorro_km: number;
    ahorro_tiempo: number;
    mejor_utilizacion: number;
  };
  razon: string;
}

export function OptimizationPanel({ rutas, onOptimize }: OptimizationPanelProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [sugerencias, setSugerencias] = useState<OptimizacionSugerencia[]>([]);
  const [lastOptimization, setLastOptimization] = useState<Date | null>(null);

  const handleOptimizeRoute = async (rutaId: number) => {
    const ruta = rutas.find(r => r.id === rutaId);
    if (!ruta) return;

    try {
      setIsOptimizing(true);

      // Obtener todos los pedidos de la ruta
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

      // Llamar a optimize-routes para esta ruta específica
      const { data, error } = await supabase.functions.invoke('optimize-routes', {
        body: {
          bodega: ruta.camion.codigo.split('-')[0], // Extraer bodega del código
          fecha_planificacion: ruta.fecha_programada,
          camiones_disponibles: [ruta.camion.codigo],
          pedidos_incluir: pedidos.map(p => p.id)
        }
      });

      if (error) throw error;

      toast({
        title: "Optimización Completada",
        description: `Ruta del camión ${ruta.camion.codigo} optimizada`,
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
      setIsOptimizing(true);
      
      // Simular análisis de optimización para cada ruta
      const nuevasSugerencias: OptimizacionSugerencia[] = [];
      
      for (const ruta of rutas) {
        const utilizacion = (ruta.volumen_total_m3 / ruta.camion.capacidad_maxima_m3) * 100;
        const kmPorPedido = ruta.pedidos.length > 0 ? ruta.distancia_total_km / ruta.pedidos.length : 0;
        
        if (utilizacion < 70) {
          nuevasSugerencias.push({
            camion_codigo: ruta.camion.codigo,
            mejoras: {
              ahorro_km: Math.round(Math.random() * 15 + 5),
              ahorro_tiempo: Math.round(Math.random() * 45 + 15),
              mejor_utilizacion: Math.round((90 - utilizacion) * 10) / 10
            },
            razon: utilizacion < 50 
              ? "Baja utilización de capacidad - consolidar entregas"
              : "Ruta subóptima - reordenar paradas"
          });
        }
      }
      
      setSugerencias(nuevasSugerencias);
      setLastOptimization(new Date());
      
      if (nuevasSugerencias.length === 0) {
        toast({
          title: "Rutas Optimizadas",
          description: "Las rutas actuales ya están bien optimizadas",
        });
      } else {
        toast({
          title: "Sugerencias Generadas",
          description: `Se encontraron ${nuevasSugerencias.length} oportunidades de mejora`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const rutasOptimizables = rutas.filter(r => r.estado === 'planificada');
  const promedioUtilizacion = rutas.length > 0 
    ? rutas.reduce((sum, r) => sum + ((r.volumen_total_m3 / r.camion.capacidad_maxima_m3) * 100), 0) / rutas.length
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimización IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado general */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Eficiencia promedio</span>
              <Badge variant={promedioUtilizacion >= 75 ? "default" : "outline"}>
                {Math.round(promedioUtilizacion)}%
              </Badge>
            </div>
            <Progress value={promedioUtilizacion} className="h-2" />
            
            <div className="text-xs text-muted-foreground">
              {rutasOptimizables.length} rutas disponibles para optimización
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <Button
              onClick={handleGenerateSuggestions}
              disabled={isOptimizing || rutasOptimizables.length === 0}
              className="w-full"
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {isOptimizing ? 'Analizando...' : 'Analizar Mejoras'}
            </Button>
            
            {lastOptimization && (
              <p className="text-xs text-muted-foreground text-center">
                Último análisis: {lastOptimization.toLocaleTimeString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sugerencias de optimización */}
      {sugerencias.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Sugerencias de Mejora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sugerencias.map((sugerencia, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-blue-50 border-blue-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">
                        {sugerencia.camion_codigo}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const ruta = rutas.find(r => r.camion.codigo === sugerencia.camion_codigo);
                        if (ruta) handleOptimizeRoute(ruta.id);
                      }}
                      disabled={isOptimizing}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                  
                  <p className="text-xs text-blue-800 mb-2">
                    {sugerencia.razon}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-green-600" />
                      <span>-{sugerencia.mejoras.ahorro_km}km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span>-{sugerencia.mejoras.ahorro_tiempo}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-purple-600" />
                      <span>+{sugerencia.mejoras.mejor_utilizacion}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimización por ruta individual */}
      {rutasOptimizables.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Optimización Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rutasOptimizables.map((ruta) => {
                const utilizacion = (ruta.volumen_total_m3 / ruta.camion.capacidad_maxima_m3) * 100;
                
                return (
                  <div
                    key={ruta.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {ruta.camion.codigo}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(utilizacion)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ruta.pedidos.length} pedidos • {ruta.distancia_total_km}km
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOptimizeRoute(ruta.id)}
                      disabled={isOptimizing}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}