import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Zap
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

  const bodegas = [
    { value: 'Antioquia', label: 'Antioquia' },
    { value: 'Huila', label: 'Huila' },
    { value: 'Bolívar', label: 'Bolívar' }
  ];

  const handleGenerateRoutes = async () => {
    if (!selectedBodega) {
      toast({
        title: "Error",
        description: "Por favor selecciona una bodega",
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

      setOptimizationResult(data);
      
      if (data.rutas_optimizadas.length === 0) {
        toast({
          title: "Sin rutas disponibles",
          description: data.mensaje || "No hay pedidos o camiones disponibles para optimizar",
        });
      } else {
        toast({
          title: "Rutas generadas",
          description: `Se generaron ${data.rutas_optimizadas.length} rutas optimizadas`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
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

      toast({
        title: "Rutas aprobadas",
        description: data.mensaje,
      });

      setIsOpen(false);
      setOptimizationResult(null);
      setSelectedBodega('');
      onOptimizationComplete();
    } catch (error: any) {
      toast({
        title: "Error",
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetModal();
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Zap className="h-4 w-4 mr-2" />
          Optimizar por Región
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimización Manual por Región
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de bodega */}
          {!optimizationResult && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Seleccionar Bodega
                </label>
                <Select value={selectedBodega} onValueChange={setSelectedBodega}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una bodega para optimizar" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodegas.map((bodega) => (
                      <SelectItem key={bodega.value} value={bodega.value}>
                        {bodega.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateRoutes}
                disabled={!selectedBodega || isGenerating}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generando rutas...' : 'Generar Rutas Sugeridas'}
              </Button>
            </div>
          )}

          {/* Vista previa de rutas optimizadas */}
          {optimizationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Rutas Optimizadas - {optimizationResult.bodega}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetModal}
                >
                  Nueva Optimización
                </Button>
              </div>

              {/* Rutas generadas */}
              {optimizationResult.rutas_optimizadas.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-success">
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Rutas Sugeridas ({optimizationResult.rutas_optimizadas.length})
                  </h4>
                  
                  <div className="grid gap-4">
                    {optimizationResult.rutas_optimizadas.map((ruta, index) => (
                      <Card key={index} className="border-l-4 border-l-success">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Truck className="h-5 w-5 text-primary" />
                              <div>
                                <CardTitle className="text-base">
                                  {ruta.camion.codigo} - {ruta.camion.conductor_nombre}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {ruta.camion.conductor_telefono}
                                </p>
                              </div>
                            </div>
                            <Badge variant="default">
                              {Math.round(ruta.resumen.porcentaje_capacidad)}% Cap.
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Resumen de la ruta */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span>{ruta.resumen.total_pedidos} pedidos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>{ruta.resumen.distancia_km} km</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{ruta.resumen.tiempo_horas}h</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <span>{ruta.resumen.volumen_utilizado}m³</span>
                            </div>
                          </div>

                          {/* Lista de pedidos */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Secuencia de entregas:</h5>
                            <div className="space-y-1">
                              {ruta.pedidos_detalle.map((pedido) => (
                                <div key={pedido.id} className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded">
                                  <Badge variant="outline" className="text-xs">
                                    {pedido.orden}
                                  </Badge>
                                  <span className="font-medium">{pedido.hora_estimada}</span>
                                  <span className="flex-1">{pedido.nombre_cliente}</span>
                                  <span className="text-muted-foreground">
                                    {pedido.direccion_entrega}
                                  </span>
                                  {pedido.prioridad >= 3 && (
                                    <AlertTriangle className="h-3 w-3 text-warning" />
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
                <div className="space-y-3">
                  <h4 className="font-medium text-warning">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Pedidos No Asignados ({optimizationResult.pedidos_no_asignados.length})
                  </h4>
                  
                  <Card className="border-l-4 border-l-warning">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {optimizationResult.pedidos_no_asignados.map((pedido) => (
                          <div key={pedido.id} className="flex items-center justify-between text-sm p-2 bg-warning/10 rounded">
                            <span>#{pedido.id} - {pedido.nombre_cliente}</span>
                            <span className="text-muted-foreground">
                              {pedido.volumen_total_m3}m³
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        <strong>Razón:</strong> {optimizationResult.razon}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Botón de aprobación */}
              {optimizationResult.rutas_optimizadas.length > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleApproveRoutes}
                    disabled={isApproving}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className={`h-4 w-4 mr-2 ${isApproving ? 'animate-spin' : ''}`} />
                    {isApproving ? 'Aprobando rutas...' : 'Aprobar y Asignar Rutas'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}