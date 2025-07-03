import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Truck, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  X,
  ChevronRight,
  Zap
} from 'lucide-react';
import { BodegaEstadisticas } from '@/pages/Logistics';
import { useState } from 'react';

interface AlertasPanelProps {
  bodegas: BodegaEstadisticas[];
}

interface Alerta {
  id: string;
  tipo: 'critica' | 'advertencia' | 'info';
  icono: any;
  titulo: string;
  descripcion: string;
  bodegas: string[];
  contador: number;
  accion?: string;
}

const AlertasPanel = ({ bodegas }: AlertasPanelProps) => {
  const [alertasDismissed, setAlertasDismissed] = useState<Set<string>>(new Set());

  const totalUrgentes = bodegas.reduce((sum, b) => sum + b.pedidos_urgentes, 0);
  const bodegasSinCapacidad = bodegas.filter(b => b.capacidad_disponible <= 0);
  const bodegasSinCamiones = bodegas.filter(b => b.total_camiones === 0);
  const bodegasAltaCarga = bodegas.filter(b => {
    const totalCapacidad = b.capacidad_disponible + b.volumen_pendiente;
    return totalCapacidad > 0 && (b.volumen_pendiente / totalCapacidad) > 0.8;
  });

  const alertas: Alerta[] = [];

  // Alerta crítica: Pedidos urgentes
  if (totalUrgentes > 0) {
    alertas.push({
      id: 'urgentes',
      tipo: 'critica',
      icono: Clock,
      titulo: 'Pedidos Urgentes Detectados',
      descripcion: 'Requieren despacho inmediato para cumplir con los tiempos de entrega',
      bodegas: bodegas.filter(b => b.pedidos_urgentes > 0).map(b => b.nombre),
      contador: totalUrgentes,
      accion: 'Revisar Pedidos'
    });
  }

  // Alerta crítica: Bodegas sin capacidad
  if (bodegasSinCapacidad.length > 0) {
    alertas.push({
      id: 'sin-capacidad',
      tipo: 'critica',
      icono: AlertTriangle,
      titulo: 'Capacidad Excedida',
      descripcion: 'Algunas bodegas han superado su capacidad máxima de almacenamiento',
      bodegas: bodegasSinCapacidad.map(b => b.nombre),
      contador: bodegasSinCapacidad.length,
      accion: 'Redistribuir Carga'
    });
  }

  // Alerta advertencia: Bodegas sin camiones
  if (bodegasSinCamiones.length > 0) {
    alertas.push({
      id: 'sin-camiones',
      tipo: 'advertencia',
      icono: Truck,
      titulo: 'Falta de Vehículos',
      descripcion: 'Bodegas sin camiones asignados no pueden realizar entregas',
      bodegas: bodegasSinCamiones.map(b => b.nombre),
      contador: bodegasSinCamiones.length,
      accion: 'Asignar Vehículos'
    });
  }

  // Alerta info: Alta carga de trabajo
  if (bodegasAltaCarga.length > 0) {
    alertas.push({
      id: 'alta-carga',
      tipo: 'info',
      icono: TrendingUp,
      titulo: 'Alta Carga de Trabajo',
      descripcion: 'Bodegas operando cerca del límite de capacidad',
      bodegas: bodegasAltaCarga.map(b => b.nombre),
      contador: bodegasAltaCarga.length,
      accion: 'Monitorear'
    });
  }

  const alertasVisible = alertas.filter(a => !alertasDismissed.has(a.id));

  const dismissAlerta = (id: string) => {
    setAlertasDismissed(prev => new Set(prev).add(id));
  };

  const getAlertaStyles = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'critica':
        return {
          card: 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50',
          header: 'text-red-700',
          badge: 'bg-red-500 text-white animate-pulse',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'advertencia':
        return {
          card: 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50',
          header: 'text-amber-700',
          badge: 'bg-amber-500 text-white',
          icon: 'text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'info':
        return {
          card: 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50',
          header: 'text-blue-700',
          badge: 'bg-blue-500 text-white',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  if (alertasVisible.length === 0) {
    // Estado sin alertas - Panel de confirmación
    return (
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-emerald-800 text-lg">Sistema Operativo</h3>
              <p className="text-emerald-600 text-sm">No hay alertas críticas en este momento</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const alertasCriticas = alertasVisible.filter(a => a.tipo === 'critica').length;
  const totalAlertas = alertasVisible.length;

  return (
    <div className="space-y-4">
      {/* Header del panel de alertas */}
      <Card className="border-slate-200 bg-white shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-slate-900">Centro de Alertas</span>
                <p className="text-sm font-normal text-slate-500 mt-1">
                  Monitoreo en tiempo real del sistema logístico
                </p>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-3">
              {alertasCriticas > 0 && (
                <Badge className="bg-red-500 text-white animate-pulse px-3 py-1">
                  <Zap className="w-3 h-3 mr-1" />
                  {alertasCriticas} crítica{alertasCriticas > 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="secondary" className="px-3 py-1">
                {totalAlertas} alerta{totalAlertas > 1 ? 's' : ''} activa{totalAlertas > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {alertasVisible.map((alerta) => {
          const styles = getAlertaStyles(alerta.tipo);
          const IconComponent = alerta.icono;

          return (
            <Card 
              key={alerta.id} 
              className={`${styles.card} border-2 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
            >
              {/* Indicador de prioridad */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                alerta.tipo === 'critica' ? 'bg-red-500' : 
                alerta.tipo === 'advertencia' ? 'bg-amber-500' : 'bg-blue-500'
              }`}></div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      alerta.tipo === 'critica' ? 'bg-red-100' :
                      alerta.tipo === 'advertencia' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${styles.icon} ${
                        alerta.tipo === 'critica' ? 'animate-pulse' : ''
                      }`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className={`text-lg font-bold ${styles.header}`}>
                        {alerta.titulo}
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        {alerta.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`${styles.badge} text-lg px-3 py-1 font-bold`}>
                      {alerta.contador}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlerta(alerta.id)}
                      className="p-1 hover:bg-slate-100 rounded-full"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bodegas afectadas */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Bodegas afectadas:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alerta.bodegas.map((bodega, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs bg-white/80 border-slate-300"
                      >
                        {bodega}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Botón de acción */}
                {alerta.accion && (
                  <Button 
                    className={`w-full ${styles.button} shadow-md hover:shadow-lg transition-all duration-200 group`}
                    size="sm"
                  >
                    {alerta.accion}
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                )}

                {/* Timestamp */}
                <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-200/50">
                  Detectado: {new Date().toLocaleTimeString('es-CO')}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumen ejecutivo */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-800">Estado del Sistema</p>
                <p className="text-sm text-slate-600">
                  {alertasCriticas > 0 
                    ? `${alertasCriticas} situación${alertasCriticas > 1 ? 'es' : ''} crítica${alertasCriticas > 1 ? 's' : ''} requiere${alertasCriticas === 1 ? '' : 'n'} atención inmediata`
                    : 'Sistema operando dentro de parámetros normales'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                alertasCriticas > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              }`}></div>
              <span className="text-sm font-medium text-slate-700">
                {alertasCriticas > 0 ? 'Acción Requerida' : 'Operativo'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertasPanel;