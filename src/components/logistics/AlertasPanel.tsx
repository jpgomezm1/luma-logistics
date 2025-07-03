import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Truck } from 'lucide-react';
import { BodegaEstadisticas } from '@/pages/Logistics';

interface AlertasPanelProps {
  bodegas: BodegaEstadisticas[];
}

const AlertasPanel = ({ bodegas }: AlertasPanelProps) => {
  const totalUrgentes = bodegas.reduce((sum, b) => sum + b.pedidos_urgentes, 0);
  const bodegasSinCapacidad = bodegas.filter(b => b.capacidad_disponible <= 0);
  const bodegasSinCamiones = bodegas.filter(b => b.total_camiones === 0);

  if (totalUrgentes === 0 && bodegasSinCapacidad.length === 0 && bodegasSinCamiones.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-warning">
          <AlertTriangle className="h-5 w-5" />
          Alertas del Sistema
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pedidos urgentes */}
          {totalUrgentes > 0 && (
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
              <Clock className="h-5 w-5 text-destructive animate-pulse" />
              <div>
                <div className="font-medium text-destructive">
                  {totalUrgentes} pedidos urgentes
                </div>
                <div className="text-sm text-muted-foreground">
                  Requieren atención inmediata
                </div>
              </div>
            </div>
          )}

          {/* Bodegas sin capacidad */}
          {bodegasSinCapacidad.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <div className="font-medium text-warning">
                  Capacidad sobrecargada
                </div>
                <div className="text-sm text-muted-foreground">
                  {bodegasSinCapacidad.map(b => b.nombre).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Bodegas sin camiones */}
          {bodegasSinCamiones.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <Truck className="h-5 w-5 text-secondary" />
              <div>
                <div className="font-medium text-secondary">
                  Sin camiones asignados
                </div>
                <div className="text-sm text-muted-foreground">
                  {bodegasSinCamiones.map(b => b.nombre).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertasPanel;