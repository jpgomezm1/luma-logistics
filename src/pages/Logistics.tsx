import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import BodegaCard from '@/components/logistics/BodegaCard';
import AlertasPanel from '@/components/logistics/AlertasPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Warehouse, 
  TrendingUp, 
  Truck, 
  Package, 
  MapPin, 
  Activity, 
  BarChart3,
  Filter,
  Search,
  Download,
  Settings,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Grid3X3,
  List,
  Zap,
  Globe
} from 'lucide-react';

export interface BodegaEstadisticas {
  id: number;
  nombre: string;
  departamento: string;
  max_dias_entrega: number;
  pedidos_pendientes: number;
  total_camiones: number;
  volumen_pendiente: number;
  pedidos_urgentes: number;
  capacidad_disponible: number;
}

type ViewMode = 'grid' | 'list';
type SortOrder = 'nombre' | 'pendientes_high' | 'pendientes_low' | 'urgentes' | 'capacidad';
type FilterDepartamento = 'todos' | string;

const Logistics = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bodegas, setBodegas] = useState<BodegaEstadisticas[]>([]);
  const [filteredBodegas, setFilteredBodegas] = useState<BodegaEstadisticas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('urgentes');
  const [filterDepartamento, setFilterDepartamento] = useState<FilterDepartamento>('todos');
  const [searchTerm, setSearchTerm] = useState('');
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
      fetchBodegasData();
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(fetchBodegasData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    // Aplicar filtros y ordenamiento
    let filtered = [...bodegas];

    // Filtro por departamento
    if (filterDepartamento !== 'todos') {
      filtered = filtered.filter(bodega => bodega.departamento === filterDepartamento);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(bodega => 
        bodega.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bodega.departamento.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'pendientes_high':
          return b.pedidos_pendientes - a.pedidos_pendientes;
        case 'pendientes_low':
          return a.pedidos_pendientes - b.pedidos_pendientes;
        case 'urgentes':
          return b.pedidos_urgentes - a.pedidos_urgentes;
        case 'capacidad':
          return b.capacidad_disponible - a.capacidad_disponible;
        default:
          return 0;
      }
    });

    setFilteredBodegas(filtered);
  }, [bodegas, filterDepartamento, searchTerm, sortOrder]);

  const fetchBodegasData = async (showRefreshFeedback = false) => {
    try {
      if (showRefreshFeedback) setIsRefreshing(true);
      if (!showRefreshFeedback) setIsLoading(true);

      // Obtener todas las bodegas
      const { data: bodegasData, error: bodegasError } = await supabase
        .from('bodegas')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (bodegasError) throw bodegasError;

      // Obtener estadísticas para cada bodega
      const bodegasEstadisticas: BodegaEstadisticas[] = [];

      for (const bodega of bodegasData || []) {
        // Pedidos pendientes
        const { data: pedidosPendientes } = await supabase
          .from('pedidos')
          .select('volumen_total_m3, prioridad, fecha_limite_entrega')
          .eq('bodega_asignada', bodega.nombre)
          .eq('estado', 'pendiente');

        // Camiones de la bodega
        const { data: camiones } = await supabase
          .from('camiones')
          .select('capacidad_maxima_m3, estado')
          .eq('bodega_id', bodega.id)
          .eq('activo', true);

        const volumenPendiente = pedidosPendientes?.reduce((sum, p) => sum + (p.volumen_total_m3 || 0), 0) || 0;
        const pedidosUrgentes = pedidosPendientes?.filter(p => {
          const fechaLimite = new Date(p.fecha_limite_entrega);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          return diasRestantes <= 1 || p.prioridad >= 3;
        }).length || 0;

        const capacidadTotal = camiones?.reduce((sum, c) => sum + c.capacidad_maxima_m3, 0) || 0;
        const capacidadDisponible = capacidadTotal - volumenPendiente;

        bodegasEstadisticas.push({
          id: bodega.id,
          nombre: bodega.nombre,
          departamento: bodega.departamento,
          max_dias_entrega: bodega.max_dias_entrega,
          pedidos_pendientes: pedidosPendientes?.length || 0,
          total_camiones: camiones?.length || 0,
          volumen_pendiente: volumenPendiente,
          pedidos_urgentes: pedidosUrgentes,
          capacidad_disponible: capacidadDisponible
        });
      }

      setBodegas(bodegasEstadisticas);

      if (showRefreshFeedback) {
        toast({
          title: "Datos actualizados",
          description: "La información de las bodegas se ha actualizado correctamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de las bodegas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (showRefreshFeedback) setIsRefreshing(false);
    }
  };

  const calcularEstadisticasGlobales = () => {
    const totalPedidos = bodegas.reduce((sum, b) => sum + b.pedidos_pendientes, 0);
    const totalUrgentes = bodegas.reduce((sum, b) => sum + b.pedidos_urgentes, 0);
    const totalCamiones = bodegas.reduce((sum, b) => sum + b.total_camiones, 0);
    const totalVolumen = bodegas.reduce((sum, b) => sum + b.volumen_pendiente, 0);
    const totalCapacidad = bodegas.reduce((sum, b) => sum + b.capacidad_disponible + b.volumen_pendiente, 0);
    const utilizacionPromedio = totalCapacidad > 0 ? (totalVolumen / totalCapacidad) * 100 : 0;
    const bodegasCriticas = bodegas.filter(b => b.pedidos_urgentes > 0 || b.capacidad_disponible <= 0).length;
    const bodegasOperativas = bodegas.filter(b => b.pedidos_pendientes > 0 && b.total_camiones > 0 && b.capacidad_disponible > 0).length;

    return {
      totalPedidos,
      totalUrgentes,
      totalCamiones,
      totalVolumen,
      utilizacionPromedio,
      bodegasCriticas,
      bodegasOperativas,
      totalBodegas: bodegas.length
    };
  };

  const getDepartamentosUnicos = () => {
    return Array.from(new Set(bodegas.map(b => b.departamento))).sort();
  };

  const exportarDatos = () => {
    const dataStr = JSON.stringify(filteredBodegas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bodegas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = {
    total: bodegas.reduce((sum, b) => sum + b.pedidos_pendientes, 0),
    pendientes: bodegas.reduce((sum, b) => sum + b.pedidos_pendientes, 0),
    despachados: 0
  };

  const estadisticasGlobales = calcularEstadisticasGlobales();

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">

        
        <main className="container mx-auto px-6 py-8 space-y-8">
          {/* Header del módulo logístico */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-xl">
                <Warehouse className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Centro Logístico</h1>
                <p className="text-slate-600 font-medium">Gestión y monitoreo de red de bodegas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-700 px-4 py-2 text-sm">
                <Globe className="w-4 h-4 mr-2" />
                {bodegas.length} Bodegas Activas
              </Badge>
              <Badge className={`px-4 py-2 text-sm ${
                estadisticasGlobales.bodegasCriticas > 0 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                <Activity className="w-4 h-4 mr-2" />
                {estadisticasGlobales.bodegasOperativas} Operativas
              </Badge>
            </div>
          </div>

          {/* Estadísticas globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Pedidos</p>
                    <p className="text-3xl font-bold text-blue-900">{estadisticasGlobales.totalPedidos}</p>
                    <p className="text-xs text-blue-600 mt-1">En toda la red</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 hover:shadow-lg transition-all duration-300 ${
              estadisticasGlobales.totalUrgentes > 0 
                ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200/50' 
                : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      estadisticasGlobales.totalUrgentes > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      Pedidos Urgentes
                    </p>
                    <p className={`text-3xl font-bold ${
                      estadisticasGlobales.totalUrgentes > 0 ? 'text-red-900' : 'text-emerald-900'
                    }`}>
                      {estadisticasGlobales.totalUrgentes}
                    </p>
                    <p className={`text-xs mt-1 ${
                      estadisticasGlobales.totalUrgentes > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {estadisticasGlobales.totalUrgentes > 0 ? 'Requieren atención' : 'Todo bajo control'}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    estadisticasGlobales.totalUrgentes > 0 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}>
                    {estadisticasGlobales.totalUrgentes > 0 ? (
                      <Zap className="w-7 h-7 text-white animate-pulse" />
                    ) : (
                      <CheckCircle className="w-7 h-7 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">Flota Total</p>
                    <p className="text-3xl font-bold text-emerald-900">{estadisticasGlobales.totalCamiones}</p>
                    <p className="text-xs text-emerald-600 mt-1">Vehículos activos</p>
                  </div>
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
                    <Truck className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Utilización</p>
                    <p className="text-3xl font-bold text-purple-900">{estadisticasGlobales.utilizacionPromedio.toFixed(1)}%</p>
                    <p className="text-xs text-purple-600 mt-1">Capacidad promedio</p>
                  </div>
                  <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de alertas */}
          <AlertasPanel bodegas={bodegas} />

          {/* Controles de filtrado y vista */}
          <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-slate-600" />
                Controles de Vista y Filtrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Búsqueda */}
                  <div className="relative min-w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar bodegas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-slate-200/50 rounded-xl hover:border-slate-300 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Filtro por departamento */}
                  <Select value={filterDepartamento} onValueChange={setFilterDepartamento}>
                    <SelectTrigger className="w-48 bg-white border-slate-200/50 rounded-xl hover:border-slate-300">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue placeholder="Departamento" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200/50">
                      <SelectItem value="todos" className="rounded-lg">
                        Todos los departamentos
                      </SelectItem>
                      {getDepartamentosUnicos().map((dept) => (
                        <SelectItem key={dept} value={dept} className="rounded-lg">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Ordenamiento */}
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                    <SelectTrigger className="w-48 bg-white border-slate-200/50 rounded-xl hover:border-slate-300">
                      <TrendingUp className="w-4 h-4 mr-2 text-slate-500" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200/50">
                      <SelectItem value="urgentes" className="rounded-lg">
                        Más urgentes primero
                      </SelectItem>
                      <SelectItem value="pendientes_high" className="rounded-lg">
                        Más pedidos pendientes
                      </SelectItem>
                      <SelectItem value="pendientes_low" className="rounded-lg">
                        Menos pedidos pendientes
                      </SelectItem>
                      <SelectItem value="capacidad" className="rounded-lg">
                        Mayor capacidad disponible
                      </SelectItem>
                      <SelectItem value="nombre" className="rounded-lg">
                        Nombre A-Z
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Controles de vista y acciones */}
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

                  {/* Acciones */}
                  <Button
                    variant="outline"
                    onClick={exportarDatos}
                    className="bg-white border-slate-200/50 hover:bg-slate-50 hover:border-slate-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>

                  <Button
                    onClick={() => fetchBodegasData(true)}
                    disabled={isRefreshing}
                    variant="outline"
                    className="bg-white border-slate-200/50 hover:bg-slate-50 hover:border-slate-300"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                </div>
              </div>

              {/* Información de resultados */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-slate-600">
                    Mostrando <span className="font-bold text-slate-800">{filteredBodegas.length}</span> de <span className="font-bold text-slate-800">{bodegas.length}</span> bodegas
                    {(searchTerm || filterDepartamento !== 'todos') && (
                      <span className="text-slate-500"> · Filtros aplicados</span>
                    )}
                  </p>
                </div>

                {/* Limpiar filtros */}
                {(searchTerm || filterDepartamento !== 'todos') && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDepartamento('todos');
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grid/List de bodegas */}
          {filteredBodegas.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "space-y-4"
            }>
              {filteredBodegas.map((bodega) => (
                <BodegaCard
                  key={bodega.id}
                  bodega={bodega}
                  onVerDetalle={(id) => navigate(`/logistics/bodega/${id}`)}
                  onPlanificarRutas={(id) => navigate(`/logistics/planificar/${id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Warehouse className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {bodegas.length === 0 ? 'No hay bodegas configuradas' : 'No se encontraron bodegas'}
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  {bodegas.length === 0 
                    ? 'Configure al menos una bodega para comenzar con las operaciones logísticas.'
                    : 'No se encontraron bodegas que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                  }
                </p>
                {(searchTerm || filterDepartamento !== 'todos') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDepartamento('todos');
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Footer informativo */}
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium text-slate-800">Última actualización</p>
                    <p className="text-sm text-slate-600">{new Date().toLocaleString('es-CO')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span>Operativo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span>Advertencia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Crítico</span>
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

export default Logistics;