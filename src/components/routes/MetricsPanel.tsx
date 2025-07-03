import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RutaCompleta } from '@/pages/RoutesManagement';
import { 
  Truck, 
  Package, 
  Clock, 
  MapPin,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface MetricsPanelProps {
  rutas: RutaCompleta[];
}

export function MetricsPanel({ rutas }: MetricsPanelProps) {
  // Calcular métricas
  const totalCamiones = rutas.length;
  const camionesActivos = rutas.filter(r => r.estado === 'en_curso').length;
  const rutasCompletadas = rutas.filter(r => r.estado === 'completada').length;
  
  const totalPedidos = rutas.reduce((sum, r) => sum + r.pedidos.length, 0);
  const pedidosEntregados = rutas.reduce((sum, r) => 
    sum + r.pedidos.filter(p => p.estado === 'entregado').length, 0
  );
  const pedidosFallidos = rutas.reduce((sum, r) => 
    sum + r.pedidos.filter(p => p.estado === 'fallido').length, 0
  );
  
  const distanciaTotal = rutas.reduce((sum, r) => sum + (r.distancia_total_km || 0), 0);
  const volumenTotal = rutas.reduce((sum, r) => sum + (r.volumen_total_m3 || 0), 0);
  
  const capacidadTotal = rutas.reduce((sum, r) => sum + r.camion.capacidad_maxima_m3, 0);
  const utilizacionPromedio = capacidadTotal > 0 ? (volumenTotal / capacidadTotal) * 100 : 0;
  
  const eficienciaEntrega = totalPedidos > 0 ? (pedidosEntregados / totalPedidos) * 100 : 0;
  const kmPromedioPorPedido = pedidosEntregados > 0 ? distanciaTotal / pedidosEntregados : 0;

  // Alertas
  const alertas = [];
  if (pedidosFallidos > 0) {
    alertas.push(`${pedidosFallidos} pedidos fallidos`);
  }
  if (utilizacionPromedio < 60) {
    alertas.push('Baja utilización de flota');
  }
  if (eficienciaEntrega < 90) {
    alertas.push('Eficiencia de entrega por debajo del 90%');
  }

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    progress,
    variant = 'default'
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    progress?: number;
    variant?: 'default' | 'success' | 'warning' | 'error';
  }) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'success':
          return 'border-green-200 bg-green-50';
        case 'warning':
          return 'border-yellow-200 bg-yellow-50';
        case 'error':
          return 'border-red-200 bg-red-50';
        default:
          return '';
      }
    };

    return (
      <div className={`p-3 rounded-lg border ${getVariantStyles()}`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">{value}</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {progress !== undefined && (
            <Progress value={progress} className="h-1" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Camiones Activos"
              value={`${camionesActivos}/${totalCamiones}`}
              subtitle="En operación"
              icon={Truck}
              progress={(camionesActivos / (totalCamiones || 1)) * 100}
              variant={camionesActivos > 0 ? 'success' : 'warning'}
            />
            
            <MetricCard
              title="Rutas Completadas"
              value={rutasCompletadas}
              subtitle={`de ${totalCamiones} planificadas`}
              icon={Package}
              progress={(rutasCompletadas / (totalCamiones || 1)) * 100}
            />
            
            <MetricCard
              title="Entregas Exitosas"
              value={`${pedidosEntregados}/${totalPedidos}`}
              subtitle={`${Math.round(eficienciaEntrega)}% eficiencia`}
              icon={Package}
              progress={eficienciaEntrega}
              variant={eficienciaEntrega >= 90 ? 'success' : 'warning'}
            />
            
            <MetricCard
              title="Distancia Total"
              value={`${Math.round(distanciaTotal)}km`}
              subtitle={`${Math.round(kmPromedioPorPedido)}km/pedido`}
              icon={MapPin}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Utilización de Flota</span>
              <span>{Math.round(utilizacionPromedio)}%</span>
            </div>
            <Progress 
              value={utilizacionPromedio} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round(volumenTotal)}m³ de {Math.round(capacidadTotal)}m³ disponibles
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Panel de alertas */}
      {alertas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.map((alerta, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-amber-50 rounded-md border border-amber-200"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-amber-800">{alerta}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen rápido */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Resumen Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Pedidos pendientes:</span>
              <Badge variant="outline">
                {totalPedidos - pedidosEntregados - pedidosFallidos}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Entregas fallidas:</span>
              <Badge variant={pedidosFallidos > 0 ? "destructive" : "outline"}>
                {pedidosFallidos}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Tiempo promedio:</span>
              <span>
                {rutas.length > 0 
                  ? `${Math.round(rutas.reduce((sum, r) => sum + (r.tiempo_estimado_horas || 0), 0) / rutas.length)}h`
                  : '0h'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}