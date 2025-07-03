import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RutaCamionCard } from '@/components/routes/RutaCamionCard';
import { OptimizationPanel } from '@/components/routes/OptimizationPanel';
import { MetricsPanel } from '@/components/routes/MetricsPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { Truck, Calendar, Download, RefreshCw } from 'lucide-react';

export interface RutaCompleta {
  id: number;
  fecha_programada: string;
  estado: string;
  hora_inicio: string;
  hora_fin_estimada: string;
  distancia_total_km: number;
  tiempo_estimado_horas: number;
  volumen_total_m3: number;
  ruta_optimizada: any;
  observaciones: string;
  camion: {
    id: number;
    codigo: string;
    capacidad_maxima_m3: number;
    conductor_nombre: string;
    conductor_telefono: string;
    estado: string;
  };
  pedidos: any[];
}

const RoutesManagement = () => {
  const [user, setUser] = useState<User | null>(null);
  const [rutas, setRutas] = useState<RutaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación
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
    if (user) {
      fetchRutasData();
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(() => {
        fetchRutasData(false);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, selectedDate]);

  const fetchRutasData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      if (!showLoading) setRefreshing(true);

      // Obtener rutas con información completa
      const { data: rutasData, error: rutasError } = await supabase
        .from('rutas_entrega')
        .select(`
          *,
          camiones (
            id,
            codigo,
            capacidad_maxima_m3,
            conductor_nombre,
            conductor_telefono,
            estado
          )
        `)
        .eq('fecha_programada', selectedDate)
        .order('hora_inicio');

      if (rutasError) throw rutasError;

      // Para cada ruta, obtener los pedidos asignados
      const rutasCompletas: RutaCompleta[] = [];
      
      for (const ruta of rutasData || []) {
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select('*')
          .eq('ruta_entrega_id', ruta.id)
          .order('id');

        rutasCompletas.push({
          ...ruta,
          camion: ruta.camiones,
          pedidos: pedidos || [],
          ruta_optimizada: Array.isArray(ruta.ruta_optimizada) ? ruta.ruta_optimizada : []
        });
      }

      setRutas(rutasCompletas);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de las rutas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleOptimizeAll = async () => {
    try {
      setRefreshing(true);
      
      // Llamar a la edge function para optimizar todas las rutas
      const { data, error } = await supabase.functions.invoke('generate-daily-routes', {
        body: { fecha: selectedDate }
      });

      if (error) throw error;

      toast({
        title: "Optimización Completada",
        description: `Se han optimizado ${data?.rutas_totales_creadas || 0} rutas`,
      });

      // Refrescar datos
      await fetchRutasData(false);
    } catch (error: any) {
      toast({
        title: "Error en Optimización",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportRoutes = () => {
    // Preparar datos para exportar
    const exportData = rutas.map(ruta => ({
      Camion: ruta.camion.codigo,
      Conductor: ruta.camion.conductor_nombre,
      Telefono: ruta.camion.conductor_telefono,
      Hora_Inicio: ruta.hora_inicio,
      Total_Pedidos: ruta.pedidos.length,
      Distancia_KM: ruta.distancia_total_km,
      Volumen_M3: ruta.volumen_total_m3,
      Estado: ruta.estado
    }));

    // Convertir a CSV
    const csvContent = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutas-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportación Completada",
      description: "El archivo CSV se ha descargado exitosamente",
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const rutasActivas = rutas.filter(r => r.estado !== 'completada');
  const rutasCompletadas = rutas.filter(r => r.estado === 'completada');
  const totalPedidos = rutas.reduce((sum, r) => sum + r.pedidos.length, 0);
  const pedidosEntregados = rutas.reduce((sum, r) => 
    sum + r.pedidos.filter(p => p.estado === 'entregado').length, 0
  );

  return (
    <DashboardLayout>
      <div className="bg-muted/30 min-h-full">
        {/* Header con controles */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h1 className="text-2xl font-bold">Gestión de Rutas</h1>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1 border rounded-md"
                />
                <Badge variant="outline" className="text-sm">
                  {totalPedidos} pedidos • {pedidosEntregados} entregados
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fetchRutasData(false)}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refrescar
                </Button>
                <Button
                  onClick={handleOptimizeAll}
                  variant="default"
                  size="sm"
                  disabled={refreshing}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Optimizar Todo
                </Button>
                <Button
                  onClick={handleExportRoutes}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Panel de rutas - 3 columnas */}
            <div className="xl:col-span-3">
              <Tabs defaultValue="activas" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="activas">
                    Rutas Activas ({rutasActivas.length})
                  </TabsTrigger>
                  <TabsTrigger value="completadas">
                    Completadas ({rutasCompletadas.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="activas" className="space-y-4">
                  {rutasActivas.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">
                          No hay rutas activas para la fecha seleccionada
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {rutasActivas.map((ruta) => (
                        <RutaCamionCard
                          key={ruta.id}
                          ruta={ruta}
                          onUpdateStatus={(rutaId, status) => {
                            // Actualizar estado localmente y refrescar
                            fetchRutasData(false);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completadas" className="space-y-4">
                  {rutasCompletadas.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">
                          No hay rutas completadas para la fecha seleccionada
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {rutasCompletadas.map((ruta) => (
                        <RutaCamionCard
                          key={ruta.id}
                          ruta={ruta}
                          onUpdateStatus={() => {}}
                          readonly={true}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Panel lateral - 1 columna */}
            <div className="space-y-6">
              <MetricsPanel rutas={rutas} />
              <OptimizationPanel 
                rutas={rutasActivas}
                onOptimize={() => fetchRutasData(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoutesManagement;