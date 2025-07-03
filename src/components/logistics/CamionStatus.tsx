import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  Gauge, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Navigation,
  Package,
  Route,
  Activity,
  Calendar,
  MessageCircle,
  ExternalLink,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Camion } from '@/pages/BodegaDashboard';
import { useState } from 'react';

interface CamionStatusProps {
  camion: Camion;
  onContactarConductor?: (telefono: string) => void;
  onVerRuta?: (camionId: number) => void;
  onAsignarRuta?: (camionId: number) => void;
}

const CamionStatus = ({ 
  camion, 
  onContactarConductor, 
  onVerRuta, 
  onAsignarRuta 
}: CamionStatusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const porcentajeUtilizado = (camion.volumen_utilizado / camion.capacidad_maxima_m3) * 100;
  const capacidadDisponible = camion.capacidad_maxima_m3 - camion.volumen_utilizado;

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return {
          color: 'bg-emerald-500 text-white',
          bgCard: 'bg-gradient-to-br from-emerald-50 to-green-50',
          border: 'border-emerald-200',
          icon: CheckCircle,
          texto: 'Disponible',
          descripcion: 'Listo para asignación',
          indicador: 'bg-emerald-500'
        };
      case 'en_ruta':
        return {
          color: 'bg-blue-500 text-white',
          bgCard: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          icon: Navigation,
          texto: 'En Ruta',
          descripcion: 'Realizando entregas',
          indicador: 'bg-blue-500'
        };
      case 'mantenimiento':
        return {
          color: 'bg-amber-500 text-white',
          bgCard: 'bg-gradient-to-br from-amber-50 to-orange-50',
          border: 'border-amber-200',
          icon: Settings,
          texto: 'Mantenimiento',
          descripcion: 'Fuera de servicio',
          indicador: 'bg-amber-500'
        };
      case 'inactivo':
        return {
          color: 'bg-slate-400 text-white',
          bgCard: 'bg-gradient-to-br from-slate-50 to-gray-50',
          border: 'border-slate-200',
          icon: Activity,
          texto: 'Inactivo',
          descripcion: 'No operativo',
          indicador: 'bg-slate-400'
        };
      default:
        return {
          color: 'bg-slate-400 text-white',
          bgCard: 'bg-gradient-to-br from-slate-50 to-gray-50',
          border: 'border-slate-200',
          icon: Truck,
          texto: estado,
          descripcion: 'Estado desconocido',
          indicador: 'bg-slate-400'
        };
    }
  };

  const getCapacidadConfig = (porcentaje: number) => {
    if (porcentaje >= 95) return {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      status: 'Sobrecargado',
      icon: AlertTriangle
    };
    if (porcentaje >= 80) return {
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      status: 'Carga Alta',
      icon: Gauge
    };
    if (porcentaje >= 50) return {
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      status: 'Carga Media',
      icon: Package
    };
    return {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      status: 'Disponible',
      icon: CheckCircle
    };
  };

  const estadoConfig = getEstadoConfig(camion.estado);
  const capacidadConfig = getCapacidadConfig(porcentajeUtilizado);
  const IconoEstado = estadoConfig.icon;
  const IconoCapacidad = capacidadConfig.icon;

  // Calcular eficiencia (simulado)
  const eficiencia = Math.min(95, 75 + (porcentajeUtilizado * 0.3));

  return (
    <Card className={`group transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${estadoConfig.bgCard} ${estadoConfig.border} border-2 relative overflow-hidden cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}>
      
      {/* Indicador de estado superior */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${estadoConfig.indicador}`}></div>

      {/* Elementos decorativos */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
      <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-white/10 rounded-full"></div>

      <CardContent className="p-6 space-y-4 relative z-10">
        {/* Header del camión */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                {camion.codigo}
              </h3>
              <p className="text-sm text-slate-600 font-medium">Vehículo de Carga</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={`${estadoConfig.color} font-medium px-3 py-1 shadow-sm`}>
              <IconoEstado className="w-3 h-3 mr-1.5" />
              {estadoConfig.texto}
            </Badge>
            {porcentajeUtilizado > 90 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Sobrecarga
              </Badge>
            )}
          </div>
        </div>

        {/* Información del conductor */}
        {camion.conductor_nombre && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{camion.conductor_nombre}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-3 h-3" />
                    <span>{camion.conductor_telefono || 'No disponible'}</span>
                  </div>
                </div>
              </div>
              
              {camion.conductor_telefono && onContactarConductor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContactarConductor(camion.conductor_telefono);
                  }}
                  className="bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Métricas de capacidad */}
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border ${capacidadConfig.bgColor} ${capacidadConfig.borderColor}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IconoCapacidad className={`w-5 h-5 ${capacidadConfig.textColor}`} />
                <span className="font-medium text-slate-800">Capacidad de Carga</span>
              </div>
              <Badge className={`${capacidadConfig.color} text-white text-sm`}>
                {capacidadConfig.status}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <Progress 
                value={porcentajeUtilizado} 
                className="h-3"
              />
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <p className="font-bold text-slate-800">{camion.volumen_utilizado.toFixed(1)} m³</p>
                  <p className="text-slate-600 text-xs">En uso</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">{capacidadDisponible.toFixed(1)} m³</p>
                  <p className="text-slate-600 text-xs">Disponible</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">{camion.capacidad_maxima_m3} m³</p>
                  <p className="text-slate-600 text-xs">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas adicionales expandidas */}
          {isExpanded && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              {/* Eficiencia operacional */}
              <div className="bg-white/60 rounded-xl p-4 border border-white/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Eficiencia Operacional</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{eficiencia.toFixed(1)}%</span>
                </div>
                <Progress value={eficiencia} className="h-2" />
              </div>

              {/* Estado detallado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-lg p-3 border border-white/50 text-center">
                  <Clock className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-600">Última actualización</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div className="bg-white/60 rounded-lg p-3 border border-white/50 text-center">
                  <Route className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-600">Rutas asignadas</p>
                  <p className="text-sm font-medium text-slate-800">
                    {camion.estado === 'en_ruta' ? '1' : '0'}
                  </p>
                </div>
              </div>

              {/* Estado descriptivo */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-3 border border-slate-200/50">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Estado del Sistema</span>
                </div>
                <p className="text-sm text-slate-600">{estadoConfig.descripcion}</p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {camion.estado === 'disponible' && onAsignarRuta && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onAsignarRuta(camion.id);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 group/btn"
              size="sm"
            >
              <Route className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
              Asignar Ruta
            </Button>
          )}
          
          {camion.estado === 'en_ruta' && onVerRuta && (
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                onVerRuta(camion.id);
              }}
              className="bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 transition-all duration-200 group/btn"
              size="sm"
            >
              <MapPin className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
              Ver Ruta
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={(e) => e.stopPropagation()}
            className="bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300 transition-all duration-200 group/btn"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
            Detalles
          </Button>
        </div>

        {/* Indicador de expansión */}
        <div className="text-center pt-2">
          <div className={`w-8 h-1 bg-slate-300 rounded-full mx-auto transition-all duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CamionStatus;