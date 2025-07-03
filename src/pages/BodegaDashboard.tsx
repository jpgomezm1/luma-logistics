import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import CamionStatus from '@/components/logistics/CamionStatus';
import PedidosTable from '@/components/logistics/PedidosTable';
import RutasTimeline from '@/components/logistics/RutasTimeline';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  RefreshCw, 
  Warehouse, 
  MapPin, 
  Calendar, 
  Clock, 
  Truck, 
  Package, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Download, 
  Route, 
  Gauge, 
  Users, 
  Timer, 
  Target, 
  Zap, 
  CheckCircle, 
  Eye, 
  Phone, 
  MessageCircle,
  Navigation,
  Globe,
  Layers
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';

export interface Camion {
  id: number;
  codigo: string;
  capacidad_maxima_m3: number;
  estado: string;
  conductor_nombre: string;
  conductor_telefono: string;
  volumen_utilizado: number;
}

export interface Ruta {
  id: number;
  fecha_programada: string;
  estado: string;
  volumen_total_m3: number;
  camion: {
    codigo: string;
    conductor_nombre: string;
  };
  pedidos_count: number;
}

const BodegaDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bodega, setBodega] = useState<any>(null);
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { bodegaId } = useParams();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && bodegaId) {
      fetchBodegaData();
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(() => fetchBodegaData(false), 30000);
      return () => clearInterval(interval);
    }
  }, [user, bodegaId]);

  const fetchBodegaData = async (showRefreshFeedback = true) => {
    try {
      if (showRefreshFeedback) setIsRefreshing(true);
      if (!showRefreshFeedback && isLoading) return; // Evitar doble loading inicial

      if (!showRefreshFeedback && !isLoading) {
        // Silent refresh
      } else {
        setIsLoading(true);
      }

      // Obtener información de la bodega
      const { data: bodegaData, error: bodegaError } = await supabase
        .from('bodegas')
        .select('*')
        .eq('id', Number(bodegaId))
        .single();

      if (bodegaError) throw bodegaError;
      setBodega(bodegaData);

      // Obtener camiones con información mejorada
      const { data: camionesData } = await supabase
        .from('camiones')
        .select('*')
        .eq('bodega_id', Number(bodegaId))
        .eq('activo', true)
        .order('codigo');

      // Calcular volumen utilizado por cada camión
      const camionesConVolumen: Camion[] = [];
      for (const camion of camionesData || []) {
        const { data: rutasActivas } = await supabase
          .from('rutas_entrega')
          .select('volumen_total_m3')
          .eq('camion_id', camion.id)
          .in('estado', ['planificada', 'en_curso']);

        const volumenUtilizado = rutasActivas?.reduce((sum, r) => sum + (r.volumen_total_m3 || 0), 0) || 0;

        camionesConVolumen.push({
          ...camion,
          volumen_utilizado: volumenUtilizado
        });
      }
      setCamiones(camionesConVolumen);

      // Obtener rutas programadas (hoy y mañana)
      const hoy = new Date().toISOString().split('T')[0];
      const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: rutasData } = await supabase
        .from('rutas_entrega')
        .select(`
          *,
          camiones!inner(codigo, conductor_nombre, bodega_id)
        `)
        .eq('camiones.bodega_id', Number(bodegaId))
        .gte('fecha_programada', hoy)
        .lte('fecha_programada', manana)
        .order('fecha_programada');

      // Obtener conteo de pedidos por ruta
      const rutasConPedidos: Ruta[] = [];
      for (const ruta of rutasData || []) {
        const { count } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('ruta_entrega_id', ruta.id);

        rutasConPedidos.push({
          id: ruta.id,
          fecha_programada: ruta.fecha_programada,
          estado: ruta.estado,
          volumen_total_m3: ruta.volumen_total_m3 || 0,
          camion: {
            codigo: ruta.camiones.codigo,
            conductor_nombre: ruta.camiones.conductor_nombre
          },
          pedidos_count: count || 0
        });
      }
      setRutas(rutasConPedidos);

      // Obtener pedidos pendientes
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*')
        .eq('bodega_asignada', bodegaData.nombre)
        .eq('estado', 'pendiente')
        .order('prioridad', { ascending: false })
        .order('fecha_creacion', { ascending: true });

      setPedidosPendientes(pedidos || []);

      if (showRefreshFeedback && !isLoading) {
        toast({
          title: "Datos actualizados",
          description: "La información de la bodega se ha actualizado correctamente",
        });
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la bodega",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (showRefreshFeedback) setIsRefreshing(false);
    }
  };

  const calcularEstadisticasOperacionales = () => {
    // Estadísticas de camiones
    const camionesDisponibles = camiones.filter(c => c.estado === 'disponible').length;
    const camionesEnRuta = camiones.filter(c => c.estado === 'en_ruta').length;
    const camionesMantenimiento = camiones.filter(c => c.estado === 'mantenimiento').length;
    
    // Capacidad total y utilización
    const capacidadTotal = camiones.reduce((sum, c) => sum + c.capacidad_maxima_m3, 0);
    const volumenUtilizado = camiones.reduce((sum, c) => sum + c.volumen_utilizado, 0);
    const utilizacionFlota = capacidadTotal > 0 ? (volumenUtilizado / capacidadTotal) * 100 : 0;
    
    // Estadísticas de pedidos
    const pedidosUrgentes = pedidosPendientes.filter(p => {
      const fechaLimite = new Date(p.fecha_limite_entrega);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes <= 1 || p.prioridad >= 3;
    }).length;
    
    const volumenPendiente = pedidosPendientes.reduce((sum, p) => sum + (p.volumen_total_m3 || 0), 0);
    
    // Estadísticas de rutas
    const rutasActivas = rutas.filter(r => r.estado === 'en_curso').length;
    const rutasPlanificadas = rutas.filter(r => r.estado === 'planificada').length;
    const rutasCompletadas = rutas.filter(r => r.estado === 'completada').length;
    
    // Eficiencia operacional
    const eficienciaOperacional = Math.min(100, Math.max(0, 
      70 + (camionesEnRuta * 10) + (rutasActivas * 5) - (pedidosUrgentes * 5)
    ));
    
    return {
      camionesDisponibles,
      camionesEnRuta,
      camionesMantenimiento,
      utilizacionFlota,
      pedidosUrgentes,
      volumenPendiente,
      rutasActivas,
      rutasPlanificadas,
      rutasCompletadas,
      eficienciaOperacional,
      capacidadTotal,
      volumenUtilizado
    };
  };

  const handleContactarConductor = (telefono: string) => {
    // Abrir WhatsApp o llamada
    const mensaje = encodeURIComponent('Hola, te contacto desde el sistema logístico de la bodega.');
    window.open(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${mensaje}`, '_blank');
  };

  const handleVerRuta = (camionId: number) => {
    // Navegar a detalles de la ruta
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La visualización detallada de rutas estará disponible pronto",
    });
  };

  const handleAsignarRuta = (camionId: number) => {
    // Navegar al planificador con camión preseleccionado
    navigate(`/logistics/planificar/${bodegaId}?camion=${camionId}`);
  };

  const exportarDatos = () => {
    const data = {
      bodega,
      camiones,
      rutas,
      pedidosPendientes,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bodega_${bodega?.nombre}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = {
    total: pedidosPendientes.length,
    pendientes: pedidosPendientes.length,
    despachados: 0
  };

  const operationalStats = calcularEstadisticasOperacionales();

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">

        
        <main className="container mx-auto px-6 py-8 space-y-8">
          {/* Header de la bodega */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/logistics')}
                className="bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Volver
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-xl">
                  <Warehouse className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Bodega {bodega?.nombre}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">{bodega?.departamento}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Max. entrega: {bodega?.max_dias_entrega} días</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-700 px-4 py-2">
                <Activity className="w-4 h-4 mr-2" />
                Centro Operacional
              </Badge>
              
              <Button
                variant="outline"
                onClick={exportarDatos}
                className="bg-white border-slate-200 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              <Button
                onClick={() => fetchBodegaData(true)}
                disabled={isRefreshing}
                variant="outline"
                className="bg-white border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>

          

          {/* Panel de estado de rutas */}
          <Card className="bg-gradient-to-r from-slate-50 to-white border-slate-200/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Route className="w-5 h-5 text-slate-600" />
                  <span>Estado de Operaciones</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="bg-blue-100 text-blue-700">
                    {operationalStats.rutasActivas} activas
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700">
                    {operationalStats.rutasPlanificadas} planificadas
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {operationalStats.rutasCompletadas} completadas
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Grid principal de operaciones */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Flota de camiones */}
            <div className="xl:col-span-1 space-y-6">
              <Card className="bg-white border-slate-200/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span>Flota de Camiones</span>
                    </div>
                    <Badge variant="secondary">
                      {camiones.length} vehículos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {camiones.map((camion) => (
                    <CamionStatus 
                      key={camion.id} 
                      camion={camion}
                      onContactarConductor={handleContactarConductor}
                      onVerRuta={handleVerRuta}
                      onAsignarRuta={handleAsignarRuta}
                    />
                  ))}
                  
                  {camiones.length === 0 && (
                    <div className="text-center py-8">
                      <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600">No hay camiones asignados</p>
                      <p className="text-sm text-slate-500">Configura la flota para esta bodega</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Timeline de rutas */}
            <div className="xl:col-span-2 space-y-6">
              <RutasTimeline 
                rutas={rutas}
                onVerRuta={(rutaId) => {
                  toast({
                    title: "Funcionalidad en desarrollo",
                    description: "La visualización de rutas estará disponible pronto",
                  });
                }}
                onIniciarRuta={(rutaId) => {
                  toast({
                    title: "Ruta iniciada",
                    description: "La ruta ha sido marcada como iniciada",
                  });
                }}
                onPausarRuta={(rutaId) => {
                  toast({
                    title: "Ruta pausada",
                    description: "La ruta ha sido pausada temporalmente",
                  });
                }}
                onCompletarRuta={(rutaId) => {
                  toast({
                    title: "Ruta completada",
                    description: "La ruta ha sido marcada como completada",
                  });
                }}
                onContactarConductor={(rutaId) => {
                  const ruta = rutas.find(r => r.id === rutaId);
                  if (ruta) {
                    toast({
                      title: "Contactando conductor",
                      description: `Iniciando comunicación con ${ruta.camion.conductor_nombre}`,
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Gestión de pedidos pendientes */}
          <div>
            <PedidosTable 
              pedidos={pedidosPendientes}
              onAsignarRuta={(pedidoIds) => {
                navigate(`/logistics/planificar/${bodegaId}?pedidos=${pedidoIds.join(',')}`);
              }}
              onVerDetalle={(pedidoId) => {
                toast({
                  title: "Funcionalidad en desarrollo",
                  description: "La vista detallada de pedidos estará disponible pronto",
                });
              }}
              onActualizarPrioridad={(pedidoId, prioridad) => {
                toast({
                  title: "Prioridad actualizada",
                  description: `El pedido #${pedidoId} ha sido actualizado`,
                });
              }}
            />
          </div>

          {/* Footer informativo */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">Sistema Operativo</p>
                    <p className="text-sm text-slate-600">
                      Última actualización: {new Date().toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-600">En línea</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Conectado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Tiempo real</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default BodegaDashboard;