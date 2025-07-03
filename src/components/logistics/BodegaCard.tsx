import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Clock, AlertTriangle, Activity } from 'lucide-react';
import { BodegaEstadisticas } from '@/pages/Logistics';

interface BodegaCardProps {
  bodega: BodegaEstadisticas;
  onVerDetalle: (id: number) => void;
  onPlanificarRutas: (id: number) => void;
}

const getBodegaColor = (nombre: string) => {
  switch (nombre.toUpperCase()) {
    case 'ANTIOQUIA':
      return 'border-blue-500 hover:border-blue-600 bg-blue-50/50';
    case 'HUILA':
      return 'border-green-500 hover:border-green-600 bg-green-50/50';
    case 'BOLÍVAR':
      return 'border-orange-500 hover:border-orange-600 bg-orange-50/50';
    default:
      return 'border-primary hover:border-primary/80 bg-primary/5';
  }
};

const getBodegaAccent = (nombre: string) => {
  switch (nombre.toUpperCase()) {
    case 'ANTIOQUIA':
      return 'text-blue-600 bg-blue-100';
    case 'HUILA':
      return 'text-green-600 bg-green-100';
    case 'BOLÍVAR':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-primary bg-primary/10';
  }
};

const BodegaCard = ({ bodega, onVerDetalle, onPlanificarRutas }: BodegaCardProps) => {
  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${getBodegaColor(bodega.nombre)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {bodega.nombre}
          </CardTitle>
          <Badge variant="outline" className={getBodegaAccent(bodega.nombre)}>
            {bodega.departamento}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              Pendientes
            </div>
            <div className="text-2xl font-bold text-foreground">
              {bodega.pedidos_pendientes}
            </div>
          </div>

          <div className="text-center p-3 bg-background rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Truck className="h-4 w-4" />
              Camiones
            </div>
            <div className="text-2xl font-bold text-foreground">
              {bodega.total_camiones}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Max entrega:
            </span>
            <span className="font-medium">
              {bodega.max_dias_entrega} {bodega.max_dias_entrega === 1 ? 'día' : 'días'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Volumen pendiente:</span>
            <span className="font-medium">{bodega.volumen_pendiente.toFixed(1)} m³</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacidad disponible:</span>
            <span className="font-medium text-success">
              {bodega.capacidad_disponible.toFixed(1)} m³
            </span>
          </div>

          {bodega.pedidos_urgentes > 0 && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">
                {bodega.pedidos_urgentes} pedidos urgentes
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onVerDetalle(bodega.id)}
            className="w-full"
          >
            Ver Detalle
          </Button>
          <Button 
            onClick={() => onPlanificarRutas(bodega.id)}
            className="w-full"
          >
            Planificar Rutas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BodegaCard;