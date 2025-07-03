import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RutaCamionCard } from '@/components/routes/RutaCamionCard';
import { OptimizationPanel } from '@/components/routes/OptimizationPanel';
import { RegionOptimizationModal } from '@/components/routes/RegionOptimizationModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { 
  Truck, 
  Calendar, 
  Download, 
  RefreshCw, 
  MapPin, 
  Route, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Filter, 
  Search, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Timer, 
  Target, 
  Globe, 
  Navigation, 
  Package, 
  Users, 
  CalendarDays,
  Eye,
  RotateCcw,
  FileText,
  Grid3X3,
  List,
  ArrowUpDown
} from 'lucide-react';

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

type ViewMode = 'grid' | 'list';
type FilterEstado = 'todos' | 'planificada' | 'en_curso' | 'completada' | 'pausada';
type SortField = 'hora_inicio' | 'distancia' | 'pedidos' | 'volumen' | 'camion';
type SortOrder = 'asc' | 'desc';

const RoutesManagement = () => {
  const [user, setUser] = useState<User | null>(null);
  const [rutas, setRutas] = useState<RutaCompleta[]>([]);
  const [filteredRutas, setFilteredRutas] = useState<RutaCompleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('hora_inicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeTab, setActiveTab] = useState('activas');
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

  useEffect(() => {
    // Aplicar filtros y ordenamiento
    let filtered = [...rutas];

    // Filtro por estado
    if (filterEstado !== 'todos') {
      filtered = filtered.filter(ruta => ruta.estado === filterEstado);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(ruta => 
        ruta.camion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ruta.camion.conductor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ruta.id.toString().includes(searchTerm)
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'hora_inicio':
          aValue = a.hora_inicio;
          bValue = b.hora_inicio;
          break;
        case 'distancia':
          aValue = a.distancia_total_km;
          bValue = b.distancia_total_km;
          break;
        case 'pedidos':
          aValue = a.pedidos.length;
          bValue = b.pedidos.length;
          break;
        case 'volumen':
          aValue = a.volumen_total_m3;
          bValue = b.volumen_total_m3;
          break;
        case 'camion':
          aValue = a.camion.codigo;
          bValue = b.camion.codigo;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRutas(filtered);
  }, [rutas, filterEstado, searchTerm, sortField, sortOrder]);

  const fetchRutasData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      if (!showLoading) setIsRefreshing(true);

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

      if (!showLoading && !isLoading) {
        toast({
          title: "Datos actualizados",
          description: "La información de rutas se ha actualizado correctamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de las rutas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOptimizeAll = async () => {
    try {
      setIsRefreshing(true);
      
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
      setIsRefreshing(false);
    }
  };

  const handleExportRoutes = () => {
    // Preparar datos para exportar
    const exportData = filteredRutas.map(ruta => ({
      ID: ruta.id,
      Fecha: selectedDate,
      Camion: ruta.camion.codigo,
      Conductor: ruta.camion.conductor_nombre,
      Telefono: ruta.camion.conductor_telefono,
      Hora_Inicio: ruta.hora_inicio,
      Hora_Fin_Estimada: ruta.hora_fin_estimada,
      Total_Pedidos: ruta.pedidos.length,
      Distancia_KM: ruta.distancia_total_km,
      Tiempo_Estimado_H: ruta.tiempo_estimado_horas,
      Volumen_M3: ruta.volumen_total_m3,
      Estado: ruta.estado,
      Observaciones: ruta.observaciones || ''
    }));

    // Convertir a CSV
    const csvContent = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutas-optimizadas-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportación Completada",
      description: `Se exportaron ${filteredRutas.length} rutas en formato CSV`,
    });
  };

  const calcularEstadisticasGlobales = () => {
    const totalRutas = rutas.length;
    const rutasActivas = rutas.filter(r => r.estado !== 'completada').length;
    const rutasCompletadas = rutas.filter(r => r.estado === 'completada').length;
    const rutasEnCurso = rutas.filter(r => r.estado === 'en_curso').length;
    const totalPedidos = rutas.reduce((sum, r) => sum + r.pedidos.length, 0);
    const pedidosEntregados = rutas.reduce((sum, r) => 
      sum + r.pedidos.filter(p => p.estado === 'entregado').length, 0
    );
    const distanciaTotal = rutas.reduce((sum, r) => sum + r.distancia_total_km, 0);
    const volumenTotal = rutas.reduce((sum, r) => sum + r.volumen_total_m3, 0);
    const eficienciaEntrega = totalPedidos > 0 ? (pedidosEntregados / totalPedidos) * 100 : 0;

    return {
      totalRutas,
      rutasActivas,
      rutasCompletadas,
      rutasEnCurso,
      totalPedidos,
      pedidosEntregados,
      distanciaTotal,
      volumenTotal,
      eficienciaEntrega
    };
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = calcularEstadisticasGlobales();
  const rutasActivas = filteredRutas.filter(r => r.estado !== 'completada');
  const rutasCompletadas = filteredRutas.filter(r => r.estado === 'completada');

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Header ejecutivo */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Título y fecha */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-blue-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-xl">
                    <Route className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Centro de Rutas</h1>
                    <p className="text-slate-600 font-medium">Optimización y seguimiento de entregas</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-slate-500" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-auto bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 px-3 py-1">
                    {formatearFecha(selectedDate)}
                  </Badge>
                </div>
              </div>

              {/* Controles principales */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => fetchRutasData(false)}
                  variant="outline"
                  disabled={isRefreshing}
                  className="bg-white border-slate-200 hover:bg-slate-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
                
                <RegionOptimizationModal 
                  onOptimizationComplete={() => fetchRutasData(false)}
                />
                
                <Button
                  onClick={handleOptimizeAll}
                  disabled={isRefreshing}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Optimizar Todo
                </Button>
                
                <Button
                  onClick={handleExportRoutes}
                  variant="outline"
                  className="bg-white border-slate-200 hover:bg-slate-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de métricas globales */}
        <div className="container mx-auto px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Eficiencia de entrega */}
            <Card className={`border-2 hover:shadow-lg transition-all duration-300 ${
              stats.eficienciaEntrega >= 90 
                ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50' 
                : stats.eficienciaEntrega >= 70
                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50'
                : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200/50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      stats.eficienciaEntrega >= 90 ? 'text-emerald-600' :
                      stats.eficienciaEntrega >= 70 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      Eficiencia de Entrega
                    </p>
                    <p className={`text-3xl font-bold ${
                      stats.eficienciaEntrega >= 90 ? 'text-emerald-900' :
                      stats.eficienciaEntrega >= 70 ? 'text-amber-900' : 'text-red-900'
                    }`}>
                      {stats.eficienciaEntrega.toFixed(1)}%
                    </p>
                    <Progress value={stats.eficienciaEntrega} className="mt-2 h-2" />
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    stats.eficienciaEntrega >= 90 ? 'bg-emerald-500' :
                    stats.eficienciaEntrega >= 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    <Target className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rutas activas */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Rutas Activas</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-blue-900">{stats.rutasEnCurso}</p>
                      <p className="text-sm text-blue-600">/ {stats.totalRutas}</p>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {stats.rutasActivas} pendientes
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <Navigation className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volumen total */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Volumen Total</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.volumenTotal.toFixed(1)}</p>
                    <p className="text-xs text-purple-600 mt-1">m³ en distribución</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distancia total */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Distancia Total</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.distanciaTotal.toFixed(0)}</p>
                    <p className="text-xs text-orange-600 mt-1">kilómetros programados</p>
                  </div>
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controles de filtrado y vista */}
          <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  {/* Búsqueda */}
                  <div className="relative min-w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por camión, conductor o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-slate-200/50 rounded-xl hover:border-slate-300 focus:border-blue-500"
                    />
                  </div>

                  {/* Filtro de estado */}
                  <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as FilterEstado)}>
                    <SelectTrigger className="w-44 bg-white border-slate-200/50 rounded-xl">
                      <Filter className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200/50">
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="planificada">Planificadas</SelectItem>
                      <SelectItem value="en_curso">En curso</SelectItem>
                      <SelectItem value="completada">Completadas</SelectItem>
                      <SelectItem value="pausada">Pausadas</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Ordenamiento */}
                  <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                    <SelectTrigger className="w-44 bg-white border-slate-200/50 rounded-xl">
                      <ArrowUpDown className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200/50">
                      <SelectItem value="hora_inicio">Hora de inicio</SelectItem>
                      <SelectItem value="distancia">Distancia</SelectItem>
                      <SelectItem value="pedidos">Número de pedidos</SelectItem>
                      <SelectItem value="volumen">Volumen</SelectItem>
                      <SelectItem value="camion">Camión</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="bg-white border-slate-200/50"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>

                {/* Controles de vista */}
                <div className="flex items-center gap-3">
                  {/* Selector de vista */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'list' 
                          ? 'bg-white shadow-sm text-blue-600' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  <Badge variant="secondary" className="px-3 py-1">
                    {filteredRutas.length} de {rutas.length} rutas
                  </Badge>
                </div>
              </div>

              {/* Información de resultados */}
              {(searchTerm || filterEstado !== 'todos') && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-slate-600">
                      Mostrando <span className="font-bold text-slate-800">{filteredRutas.length}</span> rutas filtradas
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterEstado('todos');
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grid principal */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Panel de rutas - 3 columnas */}
            <div className="xl:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200/50 rounded-xl p-1">
                  <TabsTrigger 
                    value="activas" 
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Rutas Activas ({rutasActivas.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completadas"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completadas ({rutasCompletadas.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="activas" className="space-y-4">
                  {rutasActivas.length === 0 ? (
                    <Card className="border-slate-200">
                      <CardContent className="text-center py-16">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Route className="w-12 h-12 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay rutas activas</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                          {rutas.length === 0 
                            ? 'No hay rutas programadas para esta fecha. Utiliza el optimizador para generar rutas.'
                            : 'No se encontraron rutas activas con los filtros aplicados.'
                          }
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className={
                      viewMode === 'grid' 
                        ? "grid grid-cols-1 lg:grid-cols-2 gap-6" 
                        : "space-y-4"
                    }>
                      {rutasActivas.map((ruta) => (
                        <RutaCamionCard
                          key={ruta.id}
                          ruta={ruta}
                          viewMode={viewMode}
                          onUpdateStatus={(rutaId, status) => {
                            // Actualizar estado localmente y refrescar
                            fetchRutasData(false);
                            toast({
                              title: "Estado actualizado",
                              description: `La ruta #${rutaId} ha sido actualizada a ${status}`,
                            });
                          }}
                          onViewDetails={(rutaId) => {
                            toast({
                              title: "Funcionalidad en desarrollo",
                              description: "La vista detallada de rutas estará disponible pronto",
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
 
                <TabsContent value="completadas" className="space-y-4">
                  {rutasCompletadas.length === 0 ? (
                    <Card className="border-slate-200">
                      <CardContent className="text-center py-16">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay rutas completadas</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                          Las rutas completadas para esta fecha aparecerán aquí una vez finalizadas.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className={
                      viewMode === 'grid' 
                        ? "grid grid-cols-1 lg:grid-cols-2 gap-6" 
                        : "space-y-4"
                    }>
                      {rutasCompletadas.map((ruta) => (
                        <RutaCamionCard
                          key={ruta.id}
                          ruta={ruta}
                          viewMode={viewMode}
                          onUpdateStatus={() => {}}
                          readonly={true}
                          onViewDetails={(rutaId) => {
                            toast({
                              title: "Funcionalidad en desarrollo",
                              description: "La vista detallada de rutas estará disponible pronto",
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
 
            {/* Panel lateral - 1 columna */}
            <div className="space-y-6">
              {/* Métricas en tiempo real */}
              <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                    Métricas del Día
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-900">{stats.totalPedidos}</p>
                      <p className="text-xs text-blue-600">Total Pedidos</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-900">{stats.pedidosEntregados}</p>
                      <p className="text-xs text-emerald-600">Entregados</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Progreso de entregas</span>
                      <span className="font-medium">{stats.eficienciaEntrega.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.eficienciaEntrega} className="h-2" />
                  </div>
 
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Distancia total:</span>
                      <span className="font-medium">{stats.distanciaTotal.toFixed(0)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Volumen total:</span>
                      <span className="font-medium">{stats.volumenTotal.toFixed(1)} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rutas en curso:</span>
                      <span className="font-medium">{stats.rutasEnCurso}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
 
              {/* Panel de optimización */}
              <OptimizationPanel 
                rutas={rutasActivas}
                onOptimize={() => fetchRutasData(false)}
                selectedDate={selectedDate}
              />
 
              {/* Estado del sistema */}
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-emerald-800">
                    <Activity className="w-5 h-5" />
                    Estado del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-emerald-700 font-medium">Sistema operativo</span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-emerald-600">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Conexión estable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      <span>Actualización automática</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Optimización disponible</span>
                    </div>
                  </div>
 
                  <div className="pt-3 border-t border-emerald-200">
                    <p className="text-xs text-emerald-600">
                      Última actualización: {new Date().toLocaleTimeString('es-CO')}
                    </p>
                  </div>
                </CardContent>
              </Card>
 
              {/* Acciones rápidas */}
              <Card className="bg-white border-slate-200/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5 text-slate-600" />
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => {
                      const fecha = new Date();
                      fecha.setDate(fecha.getDate() + 1);
                      setSelectedDate(fecha.toISOString().split('T')[0]);
                    }}
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-slate-50"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver rutas de mañana
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/logistics')}
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-slate-50"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Gestión de bodegas
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const reportData = {
                        fecha: selectedDate,
                        estadisticas: stats,
                        rutas: filteredRutas.map(r => ({
                          id: r.id,
                          camion: r.camion.codigo,
                          estado: r.estado,
                          pedidos: r.pedidos.length,
                          distancia: r.distancia_total_km
                        }))
                      };
                      
                      const blob = new Blob([JSON.stringify(reportData, null, 2)], 
                        { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `reporte-rutas-${selectedDate}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    variant="outline"
                    className="w-full justify-start bg-white hover:bg-slate-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generar reporte
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
 
          {/* Footer informativo */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Route className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">Centro de Optimización de Rutas</p>
                    <p className="text-sm text-slate-600">
                      Sistema inteligente de planificación logística
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Optimización activa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>Actualización en tiempo real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>Eficiencia {stats.eficienciaEntrega.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
 };
 
 export default RoutesManagement;