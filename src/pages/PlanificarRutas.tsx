import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Route, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PedidosTable from '@/components/logistics/PedidosTable';
import CamionStatus from '@/components/logistics/CamionStatus';
import { DashboardLayout } from '@/components/DashboardLayout';

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

interface Camion {
  id: number;
  codigo: string;
  conductor_nombre: string;
  conductor_telefono: string;
  capacidad_maxima_m3: number;
  volumen_utilizado: number;
  estado: string;
}

interface RutaOptimizada {
  camion: {
    id: number;
    codigo: string;
    conductor_nombre: string;
    conductor_telefono: string;
    capacidad_maxima_m3: number;
  };
  pedidos_detalle: {
    id: number;
    orden: number;
    hora_estimada: string;
    nombre_cliente: string;
    direccion_entrega: string;
    volumen_total_m3: number;
    prioridad: number;
  }[];
  resumen: {
    total_pedidos: number;
    volumen_utilizado: number;
    distancia_km: number;
    tiempo_horas: number;
    porcentaje_capacidad: number;
  };
}

const PlanificarRutas = () => {
  const { bodegaId } = useParams<{ bodegaId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bodegaInfo, setBodegaInfo] = useState<any>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
  const [camionesDisponibles, setCamionesDisponibles] = useState<Camion[]>([]);
  const [selectedPedidos, setSelectedPedidos] = useState<number[]>([]);
  const [rutasOptimizadas, setRutasOptimizadas] = useState<RutaOptimizada[]>([]);
  const [pedidosNoAsignados, setPedidosNoAsignados] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bodegaId) {
      cargarDatosBodega();
    }
  }, [bodegaId]);

  const cargarDatosBodega = async () => {
    try {
      setLoading(true);
      
      // Obtener información de la bodega
      const { data: bodega, error: bodegaError } = await supabase
        .from('bodegas')
        .select('*')
        .eq('id', parseInt(bodegaId!))
        .single();

      if (bodegaError) throw bodegaError;
      setBodegaInfo(bodega);

      // Obtener pedidos pendientes
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('bodega_asignada', bodega.nombre)
        .eq('estado', 'pendiente');

      if (pedidosError) throw pedidosError;
      setPedidosPendientes((pedidos || []).map(p => ({
        ...p,
        items: Array.isArray(p.items) ? p.items : []
      })));

      // Obtener camiones disponibles
      const { data: camiones, error: camionesError } = await supabase
        .from('camiones')
        .select('*')
        .eq('bodega_id', parseInt(bodegaId!))
        .eq('estado', 'disponible')
        .eq('activo', true);

      if (camionesError) throw camionesError;
      
      // Mapear camiones con volumen_utilizado calculado
      const camionsMapped = (camiones || []).map(camion => ({
        ...camion,
        volumen_utilizado: 0 // Los camiones disponibles no tienen volumen utilizado
      }));
      
      setCamionesDisponibles(camionsMapped);

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la bodega",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const optimizarRutas = async () => {
    if (selectedPedidos.length === 0) {
      toast({
        title: "Selecciona pedidos",
        description: "Debes seleccionar al menos un pedido para optimizar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsOptimizing(true);
      
      const { data, error } = await supabase.functions.invoke('manual-optimize-routes-for-region', {
        body: {
          bodega: bodegaInfo.nombre,
          accion: 'generar_preview',
          pedidos_incluir: selectedPedidos,
          camiones_disponibles: camionesDisponibles.map(c => c.codigo)
        }
      });

      if (error) throw error;

      setRutasOptimizadas(data.rutas_optimizadas || []);
      setPedidosNoAsignados(data.pedidos_no_asignados || []);
      setShowPreviewModal(true);

    } catch (error) {
      console.error('Error optimizando rutas:', error);
      toast({
        title: "Error",
        description: "No se pudieron optimizar las rutas. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const aprobarRutas = async () => {
    try {
      setIsApproving(true);
      
      const { data, error } = await supabase.functions.invoke('manual-optimize-routes-for-region', {
        body: {
          accion: 'aprobar_rutas',
          rutas_aprobadas: rutasOptimizadas
        }
      });

      if (error) throw error;

      toast({
        title: "Rutas aprobadas",
        description: data.mensaje,
        variant: "default"
      });

      setShowPreviewModal(false);
      setSelectedPedidos([]);
      cargarDatosBodega(); // Recargar datos

    } catch (error) {
      console.error('Error aprobando rutas:', error);
      toast({
        title: "Error",
        description: "No se pudieron aprobar las rutas. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleAsignarRuta = (pedidoIds: number[]) => {
    setSelectedPedidos(pedidoIds);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando datos de la bodega...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Route className="h-6 w-6" />
                Planificar Rutas - {bodegaInfo?.nombre}
              </h1>
              <p className="text-muted-foreground">
                Organiza y optimiza las entregas para {bodegaInfo?.departamento}
              </p>
            </div>
          </div>
        </div>

        {/* Layout de dos paneles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel Izquierdo: Pedidos Pendientes */}
          <div className="space-y-4">
            <PedidosTable 
              pedidos={pedidosPendientes}
              onAsignarRuta={handleAsignarRuta}
            />
          </div>

          {/* Panel Derecho: Camiones y Acciones */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Camiones Disponibles ({camionesDisponibles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {camionesDisponibles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay camiones disponibles en esta bodega
                  </div>
                ) : (
                  camionesDisponibles.map(camion => (
                    <CamionStatus key={camion.id} camion={camion} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Botón de Optimización */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={optimizarRutas}
                  disabled={selectedPedidos.length === 0 || isOptimizing || camionesDisponibles.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Optimizando...
                    </>
                  ) : (
                    `Optimizar Rutas Seleccionadas (${selectedPedidos.length})`
                  )}
                </Button>
                
                {selectedPedidos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Selecciona pedidos para optimizar
                  </p>
                )}
                
                {camionesDisponibles.length === 0 && (
                  <p className="text-sm text-destructive text-center mt-2">
                    No hay camiones disponibles
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Vista Previa */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa de Rutas Optimizadas</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Rutas Asignadas */}
              {rutasOptimizadas.map((ruta, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Camión {ruta.camion.codigo} - {ruta.camion.conductor_nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Pedidos:</strong> {ruta.resumen.total_pedidos}</p>
                        <p className="text-sm"><strong>Volumen:</strong> {ruta.resumen.volumen_utilizado?.toFixed(1)} m³</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Distancia:</strong> {ruta.resumen.distancia_km?.toFixed(1)} km</p>
                        <p className="text-sm"><strong>Tiempo:</strong> {ruta.resumen.tiempo_horas?.toFixed(1)} hrs</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Secuencia de entregas:</h4>
                      {ruta.pedidos_detalle.map((pedido, pidx) => (
                        <div key={pidx} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                          <div>
                            <span className="font-medium">{pedido.orden}. </span>
                            <span>{pedido.nombre_cliente}</span>
                            <span className="text-muted-foreground ml-2">({(pedido.direccion_entrega || '').substring(0, 30)}...)</span>
                          </div>
                          <span className="text-muted-foreground">{pedido.hora_estimada}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pedidos No Asignados */}
              {pedidosNoAsignados.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-warning">
                      Pedidos No Asignados ({pedidosNoAsignados.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pedidosNoAsignados.map((pedido, index) => (
                        <div key={index} className="p-2 bg-warning/10 rounded text-sm">
                          <strong>#{pedido.id}</strong> - {pedido.nombre_cliente}
                          <span className="text-muted-foreground ml-2">
                            Vol: {pedido.volumen_total_m3?.toFixed(1)} m³
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botones de Acción */}
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={aprobarRutas}
                  disabled={isApproving || rutasOptimizadas.length === 0}
                >
                  {isApproving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Aprobando...
                    </>
                  ) : (
                    'Aprobar y Asignar Rutas'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PlanificarRutas;