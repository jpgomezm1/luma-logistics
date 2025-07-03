import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Truck, 
  Clock, 
  AlertTriangle, 
  Activity, 
  MapPin, 
  TrendingUp, 
  Zap,
  Eye,
  Route,
  BarChart3,
  Calendar,
  Gauge,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { BodegaEstadisticas } from '@/pages/Logistics';

interface BodegaCardProps {
  bodega: BodegaEstadisticas;
  onVerDetalle: (id: number) => void;
  onPlanificarRutas: (id: number) => void;
}

const getBodegaTheme = (nombre: string) => {
  switch (nombre.toUpperCase()) {
    case 'ANTIOQUIA':
      return {
        primary: 'from-blue-500 to-indigo-600',
        secondary: 'from-blue-50 to-indigo-50',
        accent: 'text-blue-700 bg-blue-100',
        border: 'border-blue-200',
        card: 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50',
        progress: 'bg-blue-500'
      };
    case 'HUILA':
      return {
        primary: 'from-emerald-500 to-green-600',
        secondary: 'from-emerald-50 to-green-50',
        accent: 'text-emerald-700 bg-emerald-100',
        border: 'border-emerald-200',
        card: 'bg-gradient-to-br from-emerald-50/50 to-green-50/50',
        progress: 'bg-emerald-500'
      };
    case 'BOLÍVAR':
      return {
        primary: 'from-orange-500 to-red-600',
        secondary: 'from-orange-50 to-red-50',
        accent: 'text-orange-700 bg-orange-100',
        border: 'border-orange-200',
        card: 'bg-gradient-to-br from-orange-50/50 to-red-50/50',
        progress: 'bg-orange-500'
      };
    default:
      return {
        primary: 'from-slate-500 to-gray-600',
        secondary: 'from-slate-50 to-gray-50',
        accent: 'text-slate-700 bg-slate-100',
        border: 'border-slate-200',
        card: 'bg-gradient-to-br from-slate-50/50 to-gray-50/50',
        progress: 'bg-slate-500'
      };
  }
};

const BodegaCard = ({ bodega, onVerDetalle, onPlanificarRutas }: BodegaCardProps) => {
  const theme = getBodegaTheme(bodega.nombre);
  
  // Cálculos para métricas avanzadas
  const capacidadTotal = bodega.capacidad_disponible + bodega.volumen_pendiente;
  const porcentajeUso = capacidadTotal > 0 ? (bodega.volumen_pendiente / capacidadTotal) * 100 : 0;
  const eficienciaCamiones = bodega.total_camiones > 0 ? bodega.pedidos_pendientes / bodega.total_camiones : 0;
  
  // Estados operacionales
  const esCritico = bodega.pedidos_urgentes > 0 || bodega.capacidad_disponible <= 0;
  const esAdvertencia = porcentajeUso > 80 || bodega.total_camiones === 0;
  const esOptimo = !esCritico && !esAdvertencia && bodega.pedidos_pendientes > 0;

  const getEstadoOperacional = () => {
    if (esCritico) {
      return {
        label: 'Crítico',
        color: 'bg-red-500 text-white',
        icon: AlertTriangle,
        badge: 'animate-pulse'
      };
    }
    if (esAdvertencia) {
      return {
        label: 'Advertencia',
        color: 'bg-amber-500 text-white',
        icon: AlertCircle,
        badge: ''
      };
    }
    if (esOptimo) {
      return {
        label: 'Operativo',
        color: 'bg-emerald-500 text-white',
        icon: ShieldCheck,
        badge: ''
      };
    }
    return {
      label: 'Inactivo',
      color: 'bg-slate-400 text-white',
      icon: Activity,
      badge: ''
    };
  };

  const estadoOperacional = getEstadoOperacional();
  const IconoEstado = estadoOperacional.icon;

  return (
    <Card className={`group transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${theme.card} ${theme.border} border-2 hover:border-opacity-60 relative overflow-hidden`}>
      {/* Indicador de estado en la parte superior */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        esCritico ? 'bg-red-500' : 
        esAdvertencia ? 'bg-amber-500' : 
        esOptimo ? 'bg-emerald-500' : 'bg-slate-400'
      }`}></div>

      {/* Elementos decorativos de fondo */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
      <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full"></div>

      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br ${theme.primary} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                {bodega.nombre}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span className="text-sm text-slate-600 font-medium">{bodega.departamento}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={`${estadoOperacional.color} ${estadoOperacional.badge} font-medium px-3 py-1`}>
              <IconoEstado className="w-3 h-3 mr-1.5" />
              {estadoOperacional.label}
            </Badge>
            <Badge variant="outline" className={`${theme.accent} text-xs border-0`}>
              Zona {bodega.departamento}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        {/* Métricas principales en grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-600">Pendientes</span>
              </div>

            </div>
            <div className="text-2xl font-bold text-slate-900">
              {bodega.pedidos_pendientes}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {eficienciaCamiones > 0 ? `${eficienciaCamiones.toFixed(1)} por camión` : 'Sin carga'}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600">Flota</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {bodega.total_camiones}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {bodega.total_camiones === 0 ? 'Sin vehículos' : 'Vehículos activos'}
            </div>
          </div>
        </div>

        {/* Capacidad y utilización */}
        <div className="space-y-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Utilización de Capacidad</span>
              </div>
              <span className="text-sm font-bold text-slate-800">{porcentajeUso.toFixed(1)}%</span>
            </div>
            
            <Progress 
              value={porcentajeUso} 
              className="h-3 mb-3"
              // style={{ '--progress-background': theme.progress } as any}
            />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">En uso:</span>
                  <span className="font-medium text-slate-800">{bodega.volumen_pendiente.toFixed(1)} m³</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Disponible:</span>
                  <span className={`font-medium ${bodega.capacidad_disponible > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {bodega.capacidad_disponible.toFixed(1)} m³
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total:</span>
                  <span className="font-medium text-slate-800">{capacidadTotal.toFixed(1)} m³</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Max entrega:</span>
                  <span className="font-medium text-slate-800">
                    {bodega.max_dias_entrega} día{bodega.max_dias_entrega > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas específicas de la bodega */}
          {(bodega.pedidos_urgentes > 0 || bodega.capacidad_disponible <= 0 || bodega.total_camiones === 0) && (
            <div className="space-y-2">
              {bodega.pedidos_urgentes > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Zap className="h-4 w-4 text-red-600 animate-pulse" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-red-800">
                      {bodega.pedidos_urgentes} pedido{bodega.pedidos_urgentes > 1 ? 's' : ''} urgente{bodega.pedidos_urgentes > 1 ? 's' : ''}
                    </span>
                    <p className="text-xs text-red-600">Requiere atención inmediata</p>
                  </div>
                </div>
              )}

              {bodega.capacidad_disponible <= 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-amber-800">Capacidad excedida</span>
                    <p className="text-xs text-amber-600">Redistribuir carga recomendado</p>
                  </div>
                </div>
              )}

              {bodega.total_camiones === 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-800">Sin vehículos asignados</span>
                    <p className="text-xs text-blue-600">Asignar flota para operaciones</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Botones de acción mejorados */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onVerDetalle(bodega.id)}
            className="group bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300"
          >
            <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
            Ver Detalle
            <ChevronRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
          
          <Button 
            onClick={() => onPlanificarRutas(bodega.id)}
            className={`group bg-gradient-to-r ${theme.primary} hover:shadow-lg transition-all duration-300 text-white border-0`}
            disabled={bodega.pedidos_pendientes === 0 || bodega.total_camiones === 0}
          >
            <Route className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
            Planificar
            <ChevronRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>

        {/* Footer con timestamp */}
        <div className="text-xs text-slate-500 text-center pt-3 border-t border-slate-200/50">
          Actualizado: {new Date().toLocaleTimeString('es-CO')}
        </div>
      </CardContent>
    </Card>
  );
};

export default BodegaCard;