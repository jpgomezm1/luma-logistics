import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, MapPin, Package, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface FiltrosProps {
  filtroEstado: 'todos' | 'pendiente' | 'despachado';
  onFiltroChange: (filtro: 'todos' | 'pendiente' | 'despachado') => void;
  busqueda: string;
  onBusquedaChange: (busqueda: string) => void;
  totalResultados: number;
  // Nuevos props para filtros avanzados
  filtroRegion?: string;
  onFiltroRegionChange?: (region: string) => void;
  regiones?: string[];
  pedidos?: any[]; // Para calcular estadísticas
}

const Filtros = ({
  filtroEstado,
  onFiltroChange,
  busqueda,
  onBusquedaChange,
  totalResultados,
  filtroRegion = 'todas',
  onFiltroRegionChange,
  regiones = [],
  pedidos = [],
}: FiltrosProps) => {
  
  const calcularEstadisticasPorEstado = () => {
    const todos = pedidos.length;
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const despachados = pedidos.filter(p => p.estado === 'despachado').length;
    
    return { todos, pendientes, despachados };
  };

  const stats = calcularEstadisticasPorEstado();

  return (
    <div className="mb-8 space-y-6">
      {/* Header con título y estadísticas rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Panel de Pedidos</h2>
              <p className="text-sm text-slate-500">Gestiona y monitorea todos los pedidos</p>
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/50">
            <Package className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Total:</span>
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
              {stats.todos}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200/50">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-600">Pendientes:</span>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
              {stats.pendientes}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/50">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-600">Despachados:</span>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
              {stats.despachados}
            </Badge>
          </div>
        </div>
      </div>

      {/* Panel de filtros principal */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6">
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
          
          {/* Filtros por estado con diseño mejorado */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Estado del pedido
            </label>
            <Tabs value={filtroEstado} onValueChange={onFiltroChange as any} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto h-11 bg-slate-100/80 border border-slate-200/50 rounded-xl p-1">
                <TabsTrigger 
                  value="todos" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600 font-medium px-6 rounded-lg transition-all duration-300"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Todos
                  <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">
                    {stats.todos}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="pendiente"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 text-slate-600 font-medium px-6 rounded-lg transition-all duration-300"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Pendientes
                  <Badge className="ml-2 bg-amber-100 text-amber-700">
                    {stats.pendientes}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="despachado"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 text-slate-600 font-medium px-6 rounded-lg transition-all duration-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Despachados
                  <Badge className="ml-2 bg-emerald-100 text-emerald-700">
                    {stats.despachados}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Separador visual */}
          <div className="hidden xl:block w-px h-12 bg-slate-200"></div>

          {/* Filtro por región/bodega */}
          {regiones.length > 0 && onFiltroRegionChange && (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Región / Bodega
              </label>
              <Select value={filtroRegion} onValueChange={onFiltroRegionChange}>
                <SelectTrigger className="h-11 bg-white border-slate-200/50 rounded-xl hover:border-slate-300 transition-colors">
                  <SelectValue placeholder="Seleccionar región" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200/50">
                  <SelectItem value="todas" className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      Todas las regiones
                    </div>
                  </SelectItem>
                  {regiones.map((region) => (
                    <SelectItem key={region} value={region} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {region}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Separador visual */}
          <div className="hidden xl:block w-px h-12 bg-slate-200"></div>

          {/* Búsqueda mejorada */}
          <div className="flex flex-col gap-2 flex-1 max-w-sm">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar pedidos
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, ID, dirección..."
                value={busqueda}
                onChange={(e) => onBusquedaChange(e.target.value)}
                className="pl-11 h-11 bg-white border-slate-200/50 rounded-xl hover:border-slate-300 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Resultados y acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-slate-200/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-slate-600 font-medium">
              Mostrando <span className="font-bold text-slate-800">{totalResultados}</span> resultado{totalResultados !== 1 ? 's' : ''}
              {filtroEstado !== 'todos' && (
                <span className="text-slate-500"> · Filtrado por <span className="font-semibold">{filtroEstado}</span></span>
              )}
              {busqueda && (
                <span className="text-slate-500"> · Búsqueda: "<span className="font-semibold">{busqueda}</span>"</span>
              )}
            </p>
          </div>

          {/* Limpiar filtros */}
          {(busqueda || filtroEstado !== 'todos' || filtroRegion !== 'todas') && (
            <button
              onClick={() => {
                onBusquedaChange('');
                onFiltroChange('todos');
                onFiltroRegionChange?.('todas');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filtros;