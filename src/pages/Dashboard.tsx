import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import PedidoCard from '@/components/PedidoCard';
import Filtros from '@/components/Filtros';
import LoadingSpinner from '@/components/LoadingSpinner';
import ListaPreparacionDialog from '@/components/ListaPreparacionDialog';
import RevisionPedidosDialog from '@/components/RevisionPedidosDialog';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, SortAsc, SortDesc, TrendingUp, Calendar, MapPin, Package, Clock, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface Pedido {
  id: number;
  nombre_cliente: string;
  direccion_entrega: string;
  items: Array<{
    producto: string;
    cantidad: number;
    precio_unitario?: number;
    precio_total?: number;
  }>;
  estado: string;
  fecha_creacion: string;
  telegram_user_id?: number;
}

type ViewMode = 'compact' | 'grid' | 'list';
type SortOrder = 'newest' | 'oldest' | 'client_name' | 'products_high' | 'products_low';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'despachado'>('todos');
  const [filtroRegion, setFiltroRegion] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
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

    // Verificar sesión inicial
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
      fetchPedidos();
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(fetchPedidos, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    // Aplicar filtros y ordenamiento
    let filtered = [...pedidos];

    // Filtros
    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(pedido => pedido.estado === filtroEstado);
    }

    if (filtroRegion !== 'todas') {
      filtered = filtered.filter(pedido => {
        const ciudadMatch = pedido.direccion_entrega.match(/,\s*([^,]+)$/);
        return ciudadMatch && ciudadMatch[1].trim() === filtroRegion;
      });
    }

    if (busqueda) {
      filtered = filtered.filter(pedido => 
        pedido.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        pedido.id.toString().includes(busqueda) ||
        pedido.direccion_entrega.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
        case 'oldest':
          return new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime();
        case 'products_high':
          return contarProductosPedido(b) - contarProductosPedido(a);
        case 'products_low':
          return contarProductosPedido(a) - contarProductosPedido(b);
        case 'client_name':
          return a.nombre_cliente.localeCompare(b.nombre_cliente);
        default:
          return 0;
      }
    });

    setFilteredPedidos(filtered);
  }, [pedidos, filtroEstado, filtroRegion, busqueda, sortOrder]);

  const fetchPedidos = async (showRefreshFeedback = false) => {
    if (showRefreshFeedback) setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      
      // Convertir Json a array de items con tipo correcto
      const pedidosFormateados: Pedido[] = (data || []).map(pedido => ({
        id: pedido.id,
        nombre_cliente: pedido.nombre_cliente,
        direccion_entrega: pedido.direccion_entrega,
        items: Array.isArray(pedido.items) ? pedido.items as Array<{
          producto: string;
          cantidad: number;
          precio_unitario?: number;
          precio_total?: number;
        }> : [],
        estado: pedido.estado || 'pendiente',
        fecha_creacion: pedido.fecha_creacion || new Date().toISOString(),
        telegram_user_id: pedido.telegram_user_id || undefined
      }));
      
      setPedidos(pedidosFormateados);
      
      if (showRefreshFeedback) {
        toast({
          title: "Datos actualizados",
          description: "Los pedidos se han actualizado correctamente",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (showRefreshFeedback) setIsRefreshing(false);
    }
  };

  const marcarComoDespachado = async (pedidoId: number) => {
    try {
      // Optimistic update
      setPedidos(prev => 
        prev.map(pedido => 
          pedido.id === pedidoId 
            ? { ...pedido, estado: 'despachado' }
            : pedido
        )
      );

      const { error } = await supabase
        .from('pedidos')
        .update({ estado: 'despachado' })
        .eq('id', pedidoId);

      if (error) throw error;

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido marcado como despachado",
      });
    } catch (error: any) {
      // Revertir optimistic update
      setPedidos(prev => 
        prev.map(pedido => 
          pedido.id === pedidoId 
            ? { ...pedido, estado: 'pendiente' }
            : pedido
        )
      );
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el pedido",
        variant: "destructive",
      });
    }
  };

  const contarProductosPedido = (pedido: Pedido) => {
    return pedido.items.reduce((total, item) => total + item.cantidad, 0);
  };

  const calcularEstadisticas = () => {
    const total = pedidos.length;
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const despachados = pedidos.filter(p => p.estado === 'despachado').length;
    const totalProductos = pedidos.reduce((sum, pedido) => sum + contarProductosPedido(pedido), 0);
    const productosPendientes = pedidos
      .filter(p => p.estado === 'pendiente')
      .reduce((sum, pedido) => sum + contarProductosPedido(pedido), 0);
    
    return { total, pendientes, despachados, totalProductos, productosPendientes };
  };

  const extraerRegiones = () => {
    const regiones = new Set<string>();
    pedidos.forEach(pedido => {
      const ciudadMatch = pedido.direccion_entrega.match(/,\s*([^,]+)$/);
      if (ciudadMatch) {
        regiones.add(ciudadMatch[1].trim());
      }
    });
    return Array.from(regiones).sort();
  };

  const calcularPedidosUrgentes = () => {
    return pedidos.filter(pedido => {
      if (pedido.estado !== 'pendiente') return false;
      const horasTranscurridas = Math.floor((new Date().getTime() - new Date(pedido.fecha_creacion).getTime()) / (1000 * 60 * 60));
      return horasTranscurridas > 24;
    }).length;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = calcularEstadisticas();
  const pedidosUrgentes = calcularPedidosUrgentes();

  return (
    <DashboardLayout>
      <div className="min-h-full">

        
        <main className="container mx-auto px-6 py-8 space-y-8">
          {/* Estadísticas operacionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalProductos}</p>
                  <p className="text-xs text-blue-600 mt-1">En todos los pedidos</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 text-sm font-medium">Por Preparar</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.productosPendientes}</p>
                  <p className="text-xs text-amber-600 mt-1">Productos pendientes</p>
                </div>
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium">Regiones Activas</p>
                  <p className="text-2xl font-bold text-emerald-900">{extraerRegiones().length}</p>
                  <p className="text-xs text-emerald-600 mt-1">Zonas de entrega</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-6 shadow-sm hover:shadow-lg transition-all duration-300 ${
              pedidosUrgentes > 0 
                ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200/50' 
                : 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${pedidosUrgentes > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                    Pedidos Urgentes
                  </p>
                  <p className={`text-2xl font-bold ${pedidosUrgentes > 0 ? 'text-red-900' : 'text-slate-900'}`}>
                    {pedidosUrgentes}
                  </p>
                  <p className={`text-xs mt-1 ${pedidosUrgentes > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                    +24 horas pendientes
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  pedidosUrgentes > 0 ? 'bg-red-500' : 'bg-slate-500'
                }`}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtros mejorados */}
          <Filtros
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            totalResultados={filteredPedidos.length}
            filtroRegion={filtroRegion}
            onFiltroRegionChange={setFiltroRegion}
            regiones={extraerRegiones()}
            pedidos={pedidos}
          />

          {/* Controles de vista y ordenamiento */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm p-4">
            <div className="flex items-center gap-4">
              {/* Selector de vista */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Vista:</span>
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`px-3 py-2 rounded-md transition-all duration-200 text-xs font-medium ${
                      viewMode === 'compact' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Compacta
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-md transition-all duration-200 text-xs font-medium ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Tarjetas
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-md transition-all duration-200 text-xs font-medium ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Lista
                  </button>
                </div>
              </div>

              {/* Selector de ordenamiento */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Ordenar:</span>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger className="w-44 h-9 bg-white border-slate-200/50 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200/50">
                    <SelectItem value="newest" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <SortDesc className="w-4 h-4" />
                        Más recientes
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <SortAsc className="w-4 h-4" />
                        Más antiguos
                      </div>
                    </SelectItem>
                    <SelectItem value="products_high" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Más productos
                      </div>
                    </SelectItem>
                    <SelectItem value="products_low" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Menos productos
                      </div>
                    </SelectItem>
                    <SelectItem value="client_name" className="rounded-lg">
                      Cliente A-Z
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Información y botón de refresh */}
            <div className="flex items-center gap-4">
              {pedidosUrgentes > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {pedidosUrgentes} urgente{pedidosUrgentes > 1 ? 's' : ''}
                </Badge>
              )}

              {/* Nuevos botones de dialogs */}
              <div className="flex items-center gap-2">
                <ListaPreparacionDialog 
                  pedidos={pedidos}
                  filteredPedidos={filteredPedidos}
                />
                <RevisionPedidosDialog
                  pedidos={pedidos}
                  filteredPedidos={filteredPedidos}
                  onMarcarDespachado={marcarComoDespachado}
                />
              </div>
              
              <Button
                onClick={() => fetchPedidos(true)}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white border-slate-200/50 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>

          {/* Grid/List de pedidos */}
          {filteredPedidos.length > 0 ? (
            <div className={
              viewMode === 'compact' 
                ? "space-y-2" 
                : viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "space-y-4"
            }>
              {filteredPedidos.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onMarcarDespachado={marcarComoDespachado}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay pedidos para mostrar</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {busqueda || filtroEstado !== 'todos' || filtroRegion !== 'todas'
                  ? 'No se encontraron pedidos con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                  : 'No hay pedidos registrados en el sistema. Los nuevos pedidos aparecerán aquí automáticamente.'
                }
              </p>
              {(busqueda || filtroEstado !== 'todos' || filtroRegion !== 'todas') && (
                <Button
                  onClick={() => {
                    setBusqueda('');
                    setFiltroEstado('todos');
                    setFiltroRegion('todas');
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;