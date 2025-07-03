import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  User, 
  Calendar,
  Truck,
  CheckCircle,
  X,
  Eye,
  Route,
  Zap,
  TrendingUp,
  BarChart3,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Package2,
  Timer,
  MapIcon
} from 'lucide-react';

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

interface PedidosTableProps {
  pedidos: Pedido[];
  onAsignarRuta: (pedidoIds: number[]) => void;
  onVerDetalle?: (pedidoId: number) => void;
  onActualizarPrioridad?: (pedidoId: number, prioridad: number) => void;
}

type ViewMode = 'table' | 'cards';
type SortField = 'id' | 'prioridad' | 'fecha_creacion' | 'fecha_limite' | 'volumen' | 'cliente';
type SortOrder = 'asc' | 'desc';
type FilterPrioridad = 'todas' | '1' | '2' | '3';
type FilterUrgencia = 'todos' | 'urgentes' | 'normales';

const PedidosTable = ({ 
  pedidos, 
  onAsignarRuta, 
  onVerDetalle, 
  onActualizarPrioridad 
}: PedidosTableProps) => {
  const [selectedPedidos, setSelectedPedidos] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortField, setSortField] = useState<SortField>('prioridad');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterPrioridad, setFilterPrioridad] = useState<FilterPrioridad>('todas');
  const [filterUrgencia, setFilterUrgencia] = useState<FilterUrgencia>('todos');

  // Filtros y ordenamiento
  const filteredAndSortedPedidos = useMemo(() => {
    let filtered = [...pedidos];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(pedido => 
        pedido.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.direccion_entrega.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.id.toString().includes(searchTerm)
      );
    }

    // Filtro de prioridad
    if (filterPrioridad !== 'todas') {
      filtered = filtered.filter(pedido => pedido.prioridad === parseInt(filterPrioridad));
    }

    // Filtro de urgencia
    if (filterUrgencia !== 'todos') {
      filtered = filtered.filter(pedido => {
        const esUrgente = esUrgentePedido(pedido.fecha_limite_entrega);
        return filterUrgencia === 'urgentes' ? esUrgente : !esUrgente;
      });
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'prioridad':
          aValue = a.prioridad;
          bValue = b.prioridad;
          break;
        case 'fecha_creacion':
          aValue = new Date(a.fecha_creacion);
          bValue = new Date(b.fecha_creacion);
          break;
        case 'fecha_limite':
          aValue = new Date(a.fecha_limite_entrega);
          bValue = new Date(b.fecha_limite_entrega);
          break;
        case 'volumen':
          aValue = a.volumen_total_m3;
          bValue = b.volumen_total_m3;
          break;
        case 'cliente':
          aValue = a.nombre_cliente;
          bValue = b.nombre_cliente;
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

    return filtered;
  }, [pedidos, searchTerm, filterPrioridad, filterUrgencia, sortField, sortOrder]);

  const togglePedido = (pedidoId: number) => {
    setSelectedPedidos(prev => 
      prev.includes(pedidoId) 
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const selectAll = () => {
    setSelectedPedidos(filteredAndSortedPedidos.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPedidos([]);
  };

  const getPrioridadConfig = (prioridad: number) => {
    switch (prioridad) {
      case 3:
        return {
          color: 'bg-red-500 text-white',
          texto: 'Crítica',
          bgCard: 'bg-red-50 border-red-200',
          icon: Zap
        };
      case 2:
        return {
          color: 'bg-amber-500 text-white',
          texto: 'Media',
          bgCard: 'bg-amber-50 border-amber-200',
          icon: Clock
        };
      default:
        return {
          color: 'bg-emerald-500 text-white',
          texto: 'Normal',
          bgCard: 'bg-emerald-50 border-emerald-200',
          icon: CheckCircle
        };
    }
  };

  const esUrgentePedido = (fechaLimite: string) => {
    const fecha = new Date(fechaLimite);
    const hoy = new Date();
    const diasRestantes = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 1;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearFechaRelativa = (fecha: string) => {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const diffMs = fechaObj.getTime() - hoy.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return `Vencido (${Math.abs(diffDias)}d)`;
    if (diffDias === 0) return 'Hoy';
    if (diffDias === 1) return 'Mañana';
    return `${diffDias} días`;
  };

  const extraerCiudad = (direccion: string) => {
    const ciudadMatch = direccion.match(/,\s*([^,]+)$/);
    return ciudadMatch ? ciudadMatch[1].trim() : 'N/A';
  };

  const calcularEstadisticas = () => {
    const total = filteredAndSortedPedidos.length;
    const urgentes = filteredAndSortedPedidos.filter(p => esUrgentePedido(p.fecha_limite_entrega)).length;
    const volumenTotal = filteredAndSortedPedidos.reduce((sum, p) => sum + (p.volumen_total_m3 || 0), 0);
    const prioridadAlta = filteredAndSortedPedidos.filter(p => p.prioridad >= 3).length;

    return { total, urgentes, volumenTotal, prioridadAlta };
  };

  const exportarSeleccionados = () => {
    const pedidosSeleccionados = filteredAndSortedPedidos.filter(p => selectedPedidos.includes(p.id));
    const dataStr = JSON.stringify(pedidosSeleccionados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pedidos_seleccionados_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = calcularEstadisticas();

  // Componente de Card de Pedido
  const PedidoCard = ({ pedido }: { pedido: Pedido }) => {
    const prioridadConfig = getPrioridadConfig(pedido.prioridad);
    const esUrgente = esUrgentePedido(pedido.fecha_limite_entrega);
    const IconoPrioridad = prioridadConfig.icon;
    const isSelected = selectedPedidos.includes(pedido.id);

    return (
      <Card className={`group transition-all duration-300 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'hover:scale-[1.01]'
      } ${esUrgente ? 'border-l-4 border-l-red-500' : ''} relative overflow-hidden`}>
        
        {/* Indicador de urgencia */}
        {esUrgente && (
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-red-500">
            <AlertTriangle className="absolute -top-8 -left-6 w-4 h-4 text-white animate-pulse" />
          </div>
        )}

        <CardContent className="p-5 space-y-4">
          {/* Header con checkbox y ID */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => togglePedido(pedido.id)}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900">#{pedido.id.toString().padStart(4, '0')}</span>
                <Badge className={`${prioridadConfig.color} font-medium px-2 py-1`}>
                  <IconoPrioridad className="w-3 h-3 mr-1" />
                  {prioridadConfig.texto}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {esUrgente && (
                <Badge variant="destructive" className="animate-pulse text-xs">
                  <Timer className="w-3 h-3 mr-1" />
                  Urgente
                </Badge>
              )}
              <span className="text-sm font-medium text-slate-600">
                {pedido.volumen_total_m3?.toFixed(1) || 0} m³
              </span>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">{pedido.nombre_cliente}</h3>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-700">{extraerCiudad(pedido.direccion_entrega)}</p>
                <p className="text-sm text-slate-600 line-clamp-2">{pedido.direccion_entrega}</p>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">
                Productos ({pedido.items?.length || 0})
              </span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200/50 max-h-24 overflow-y-auto">
              {pedido.items?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-1">
                  <span className="text-slate-700">{item.producto}</span>
                  <Badge variant="outline" className="text-xs">x{item.cantidad}</Badge>
                </div>
              ))}
              {pedido.items?.length > 3 && (
                <div className="text-xs text-slate-500 text-center pt-1">
                  +{pedido.items.length - 3} productos más
                </div>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Creado</span>
              </div>
              <p className="text-sm font-semibold text-blue-900">{formatearFecha(pedido.fecha_creacion)}</p>
            </div>
            
            <div className={`rounded-lg p-3 ${esUrgente ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`w-4 h-4 ${esUrgente ? 'text-red-600' : 'text-emerald-600'}`} />
                <span className={`text-xs font-medium ${esUrgente ? 'text-red-700' : 'text-emerald-700'}`}>
                  Límite
                </span>
              </div>
              <p className={`text-sm font-semibold ${esUrgente ? 'text-red-900' : 'text-emerald-900'}`}>
                {formatearFechaRelativa(pedido.fecha_limite_entrega)}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            {onVerDetalle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerDetalle(pedido.id)}
                className="flex-1 bg-white hover:bg-slate-50 group"
              >
                <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Ver Detalle
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={() => onAsignarRuta([pedido.id])}
              className="flex-1 bg-blue-600 hover:bg-blue-700 group"
            >
              <Route className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Asignar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card className="bg-gradient-to-r from-slate-50 to-white border-slate-200/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl text-slate-900">Gestión de Pedidos</span>
                <p className="text-sm font-normal text-slate-600 mt-1">
                  {stats.total} pedidos pendientes de asignación
                </p>
              </div>
            </CardTitle>
            
            {/* Estadísticas rápidas */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-200/50">
                <BarChart3 className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Total: {stats.total}</span>
              </div>
              
              {stats.urgentes > 0 && (
                <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200/50">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">{stats.urgentes} urgentes</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200/50">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{stats.volumenTotal.toFixed(1)} m³</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controles y filtros */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/50">
        <CardContent className="p-6 space-y-4">
          {/* Barra de herramientas principal */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Búsqueda */}
              <div className="relative min-w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por cliente, dirección o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200/50 rounded-xl hover:border-slate-300 focus:border-blue-500"
                />
              </div>

              {/* Filtro de prioridad */}
              <Select value={filterPrioridad} onValueChange={(value) => setFilterPrioridad(value as FilterPrioridad)}>
                <SelectTrigger className="w-40 bg-white border-slate-200/50 rounded-xl">
                  <Filter className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/50">
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="3">Crítica</SelectItem>
                  <SelectItem value="2">Media</SelectItem>
                  <SelectItem value="1">Normal</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de urgencia */}
              <Select value={filterUrgencia} onValueChange={(value) => setFilterUrgencia(value as FilterUrgencia)}>
                <SelectTrigger className="w-40 bg-white border-slate-200/50 rounded-xl">
                  <Timer className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Urgencia" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/50">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="urgentes">Urgentes</SelectItem>
                  <SelectItem value="normales">Normales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Controles de vista y acciones */}
            <div className="flex items-center gap-3">
              {/* Selector de vista */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'cards' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'table' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Ordenamiento */}
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-44 bg-white border-slate-200/50 rounded-xl">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 mr-2 text-slate-500" />
                  ) : (
                    <SortDesc className="w-4 h-4 mr-2 text-slate-500" />
                  )}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/50">
                  <SelectItem value="prioridad">Prioridad</SelectItem>
                  <SelectItem value="fecha_limite">Fecha límite</SelectItem>
                  <SelectItem value="fecha_creacion">Fecha creación</SelectItem>
                  <SelectItem value="volumen">Volumen</SelectItem>
                  <SelectItem value="cliente">Cliente A-Z</SelectItem>
                  <SelectItem value="id">ID</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="bg-white border-slate-200/50"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Barra de selección y acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/50">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                className="bg-white border-slate-200/50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Seleccionar todos
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSelection}
                className="bg-white border-slate-200/50"
              >
                <X className="w-4 h-4 mr-2" />
                Limpiar ({selectedPedidos.length})
              </Button>
              
              {selectedPedidos.length > 0 && (
                <Button 
                  onClick={exportarSeleccionados}
                  variant="outline" 
                  size="sm"
                  className="bg-white border-slate-200/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">
                  {selectedPedidos.length} de {filteredAndSortedPedidos.length} seleccionados
                </span>
              </div>
              
              <Button 
                onClick={() => onAsignarRuta(selectedPedidos)}
                disabled={selectedPedidos.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                size="sm"
              >
                <Truck className="w-4 h-4 mr-2" />
                Asignar a Ruta ({selectedPedidos.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista/Grid de pedidos */}
      {filteredAndSortedPedidos.length > 0 ? (
        <div className={
          viewMode === 'cards' 
            ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" 
            : "space-y-3"
        }>
          {filteredAndSortedPedidos.map((pedido) => (
            <PedidoCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {pedidos.length === 0 ? 'No hay pedidos pendientes' : 'No se encontraron pedidos'}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {pedidos.length === 0 
                ? 'Todos los pedidos han sido procesados o no hay pedidos nuevos en esta bodega.'
                : 'No se encontraron pedidos que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
              }
            </p>
            {(searchTerm || filterPrioridad !== 'todas' || filterUrgencia !== 'todos') && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFilterPrioridad('todas');
                  setFilterUrgencia('todos');
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
    </div>
  );
};

export default PedidosTable;