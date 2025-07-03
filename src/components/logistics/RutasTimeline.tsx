import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  Truck, 
  Package, 
  MapPin, 
  User, 
  Route, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Navigation,
  Timer,
  Gauge,
  TrendingUp,
  BarChart3,
  Zap,
  Phone,
  MessageCircle,
  ExternalLink,
  Calendar as CalendarIcon,
  Sunrise,
  Sun,
  Sunset,
  Moon
} from 'lucide-react';
import { Ruta } from '@/pages/BodegaDashboard';
import { useState } from 'react';

interface RutasTimelineProps {
  rutas: Ruta[];
  onVerRuta?: (rutaId: number) => void;
  onIniciarRuta?: (rutaId: number) => void;
  onPausarRuta?: (rutaId: number) => void;
  onCompletarRuta?: (rutaId: number) => void;
  onContactarConductor?: (rutaId: number) => void;
}

const RutasTimeline = ({ 
  rutas, 
  onVerRuta, 
  onIniciarRuta, 
  onPausarRuta, 
  onCompletarRuta,
  onContactarConductor 
}: RutasTimelineProps) => {
  const [expandedRuta, setExpandedRuta] = useState<number | null>(null);

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'planificada':
        return {
          color: 'bg-amber-500 text-white',
          bgCard: 'bg-gradient-to-br from-amber-50 to-orange-50',
          border: 'border-amber-200',
          icon: Calendar,
          texto: 'Planificada',
          descripcion: 'Lista para iniciar',
          progress: 0,
          indicador: 'bg-amber-500'
        };
      case 'en_curso':
        return {
          color: 'bg-blue-500 text-white',
          bgCard: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          icon: Navigation,
          texto: 'En Curso',
          descripcion: 'Ruta activa',
          progress: 45, // Simulado
          indicador: 'bg-blue-500'
        };
      case 'completada':
        return {
          color: 'bg-emerald-500 text-white',
          bgCard: 'bg-gradient-to-br from-emerald-50 to-green-50',
          border: 'border-emerald-200',
          icon: CheckCircle,
          texto: 'Completada',
          descripcion: 'Entrega finalizada',
          progress: 100,
          indicador: 'bg-emerald-500'
        };
      case 'pausada':
        return {
          color: 'bg-orange-500 text-white',
          bgCard: 'bg-gradient-to-br from-orange-50 to-red-50',
          border: 'border-orange-200',
          icon: Pause,
          texto: 'Pausada',
          descripcion: 'Temporalmente detenida',
          progress: 25, // Simulado
          indicador: 'bg-orange-500'
        };
      default:
        return {
          color: 'bg-slate-400 text-white',
          bgCard: 'bg-gradient-to-br from-slate-50 to-gray-50',
          border: 'border-slate-200',
          icon: Activity,
          texto: estado,
          descripcion: 'Estado desconocido',
          progress: 0,
          indicador: 'bg-slate-400'
        };
    }
  };

  const formatearFecha = (fecha: string) => {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    const esHoy = fechaObj.toDateString() === hoy.toDateString();
    const esMañana = fechaObj.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

    if (esHoy) return 'Hoy';
    if (esMañana) return 'Mañana';
    
    return fechaObj.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getHorarioIcono = (fecha: string) => {
    const hora = new Date(fecha).getHours();
    if (hora >= 6 && hora < 12) return { icon: Sunrise, color: 'text-amber-500', periodo: 'Mañana' };
    if (hora >= 12 && hora < 18) return { icon: Sun, color: 'text-orange-500', periodo: 'Tarde' };
    if (hora >= 18 && hora < 22) return { icon: Sunset, color: 'text-orange-600', periodo: 'Noche' };
    return { icon: Moon, color: 'text-indigo-500', periodo: 'Madrugada' };
  };

  const calcularEficiencia = (ruta: Ruta) => {
    // Simulación de cálculo de eficiencia basado en volumen vs pedidos
    const eficienciaPorPedido = ruta.pedidos_count > 0 ? (ruta.volumen_total_m3 / ruta.pedidos_count) : 0;
    return Math.min(100, Math.max(0, 60 + (eficienciaPorPedido * 10)));
  };

  const getTimelinePeriodos = () => {
    const rutasHoy = rutas.filter(r => {
      const fechaRuta = new Date(r.fecha_programada);
      const hoy = new Date();
      return fechaRuta.toDateString() === hoy.toDateString();
    });

    const rutasMañana = rutas.filter(r => {
      const fechaRuta = new Date(r.fecha_programada);
      const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return fechaRuta.toDateString() === mañana.toDateString();
    });

    return { rutasHoy, rutasMañana };
  };

  const { rutasHoy, rutasMañana } = getTimelinePeriodos();

  // Componente de Ruta Individual
  const RutaCard = ({ ruta, isExpanded = false }: { ruta: Ruta; isExpanded?: boolean }) => {
    const estadoConfig = getEstadoConfig(ruta.estado);
    const IconoEstado = estadoConfig.icon;
    const horario = getHorarioIcono(ruta.fecha_programada);
    const HorarioIcono = horario.icon;
    const eficiencia = calcularEficiencia(ruta);
    const expanded = expandedRuta === ruta.id;

    return (
      <Card className={`group transition-all duration-500 hover:shadow-xl ${estadoConfig.bgCard} ${estadoConfig.border} border-2 relative overflow-hidden cursor-pointer`}
            onClick={() => setExpandedRuta(expanded ? null : ruta.id)}>
        
        {/* Indicador de estado lateral */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${estadoConfig.indicador}`}></div>
        
        {/* Elementos decorativos */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>

        <CardContent className="p-5 space-y-4 relative z-10">
          {/* Header de la ruta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{ruta.camion.codigo}</h3>
                <p className="text-sm text-slate-600 font-medium">{ruta.camion.conductor_nombre}</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${estadoConfig.color} font-medium px-3 py-1 shadow-sm`}>
                <IconoEstado className="w-3 h-3 mr-1.5" />
                {estadoConfig.texto}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <HorarioIcono className={`w-4 h-4 ${horario.color}`} />
                <span>{formatearHora(ruta.fecha_programada)}</span>
              </div>
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/50 text-center">
              <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{ruta.pedidos_count}</p>
              <p className="text-xs text-slate-600">Pedidos</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/50 text-center">
              <Gauge className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{ruta.volumen_total_m3.toFixed(1)}</p>
              <p className="text-xs text-slate-600">m³</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/50 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-slate-900">{eficiencia.toFixed(0)}%</p>
              <p className="text-xs text-slate-600">Eficiencia</p>
            </div>
          </div>

          {/* Progreso de la ruta */}
          {estadoConfig.progress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progreso de entrega</span>
                <span className="font-medium text-slate-800">{estadoConfig.progress}%</span>
              </div>
              <Progress value={estadoConfig.progress} className="h-2" />
              <div className="text-xs text-slate-500 text-center">
                {estadoConfig.progress === 100 ? 'Ruta completada' : 
                 estadoConfig.progress > 50 ? 'En proceso avanzado' : 'Inicio de ruta'}
              </div>
            </div>
          )}

          {/* Sección expandida */}
          {expanded && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 border-t border-white/50 pt-4">
              {/* Información detallada */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/80 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Detalles de Ruta</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">ID Ruta:</span>
                      <span className="font-medium">#{ruta.id.toString().padStart(4, '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Periodo:</span>
                      <span className="font-medium">{horario.periodo}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50/80 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Métricas</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Carga/Pedido:</span>
                      <span className="font-medium">{(ruta.volumen_total_m3 / Math.max(ruta.pedidos_count, 1)).toFixed(1)} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Estado:</span>
                      <span className="font-medium">{estadoConfig.descripcion}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline de estado */}
              <div className="bg-white/60 rounded-xl p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Timeline de Estado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${estadoConfig.progress >= 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <div className="flex-1 h-1 bg-slate-200 rounded">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded transition-all duration-500"
                      style={{ width: `${estadoConfig.progress}%` }}
                    ></div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${estadoConfig.progress === 100 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Inicio</span>
                  <span>Completado</span>
                </div>
              </div>

              {/* Acciones contextuales */}
              <div className="grid grid-cols-2 gap-2">
                {ruta.estado === 'planificada' && onIniciarRuta && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIniciarRuta(ruta.id);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white group/btn"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
                    Iniciar
                  </Button>
                )}
                
                {ruta.estado === 'en_curso' && onPausarRuta && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPausarRuta(ruta.id);
                    }}
                    variant="outline"
                    className="bg-white/80 border-amber-200 hover:bg-amber-50 text-amber-700 group/btn"
                    size="sm"
                  >
                    <Pause className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
                    Pausar
                  </Button>
                )}

                {onVerRuta && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerRuta(ruta.id);
                    }}
                    variant="outline"
                    className="bg-white/80 border-slate-200 hover:bg-slate-50 group/btn"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
                    Ver Detalle
                  </Button>
                )}

                {onContactarConductor && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onContactarConductor(ruta.id);
                    }}
                    variant="outline"
                    className="bg-white/80 border-green-200 hover:bg-green-50 text-green-700 group/btn"
                    size="sm"
                  >
                    <Phone className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
                    Contactar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Indicador de expansión */}
          <div className="text-center pt-2">
            <div className={`w-8 h-1 bg-slate-300 rounded-full mx-auto transition-all duration-300 ${
              expanded ? 'rotate-180' : ''
            }`}></div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Estadísticas del timeline
  const calcularEstadisticas = () => {
    const totalRutas = rutas.length;
    const rutasActivas = rutas.filter(r => r.estado === 'en_curso').length;
    const rutasCompletadas = rutas.filter(r => r.estado === 'completada').length;
    const volumenTotal = rutas.reduce((sum, r) => sum + r.volumen_total_m3, 0);
    
    return { totalRutas, rutasActivas, rutasCompletadas, volumenTotal };
  };

  const stats = calcularEstadisticas();

  return (
    <div className="space-y-6">
      {/* Header con estadísticas del timeline */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl text-slate-900">Timeline de Rutas</span>
                <p className="text-sm font-normal text-slate-600 mt-1">
                  Programación y seguimiento de entregas
                </p>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-indigo-200/50">
                <Route className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Total: {stats.totalRutas}</span>
              </div>
              
              {stats.rutasActivas > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200/50">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{stats.rutasActivas} activas</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-200/50">
                <Gauge className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">{stats.volumenTotal.toFixed(1)} m³</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline por días */}
      <div className="space-y-6">
        {/* Rutas de hoy */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sunrise className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Hoy ({rutasHoy.length} rutas)
            </h3>
            {rutasHoy.filter(r => r.estado === 'en_curso').length > 0 && (
              <Badge className="bg-blue-500 text-white animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                {rutasHoy.filter(r => r.estado === 'en_curso').length} en curso
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rutasHoy.map((ruta) => (
              <RutaCard key={ruta.id} ruta={ruta} />
            ))}
          </div>
          
          {rutasHoy.length === 0 && (
            <Card className="border-slate-200 bg-slate-50/50">
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No hay rutas programadas para hoy</p>
                <p className="text-sm text-slate-500 mt-1">Las rutas aparecerán aquí cuando sean programadas</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rutas de mañana */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Mañana ({rutasMañana.length} rutas)
            </h3>
            {rutasMañana.filter(r => r.estado === 'planificada').length > 0 && (
              <Badge className="bg-amber-500 text-white">
                <Calendar className="w-3 h-3 mr-1" />
                {rutasMañana.filter(r => r.estado === 'planificada').length} planificadas
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rutasMañana.map((ruta) => (
              <RutaCard key={ruta.id} ruta={ruta} />
            ))}
          </div>
          
          {rutasMañana.length === 0 && (
            <Card className="border-slate-200 bg-slate-50/50">
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No hay rutas programadas para mañana</p>
                <p className="text-sm text-slate-500 mt-1">Planifica las rutas del día siguiente</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Estado general cuando no hay rutas */}
      {rutas.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Route className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay rutas programadas</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Aún no se han planificado rutas de entrega. Las rutas aparecerán aquí una vez que sean creadas y asignadas a los camiones.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RutasTimeline;