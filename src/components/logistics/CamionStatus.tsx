import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, User, Phone } from 'lucide-react';
import { Camion } from '@/pages/BodegaDashboard';

interface CamionStatusProps {
  camion: Camion;
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'disponible':
      return 'bg-success text-success-foreground';
    case 'en_ruta':
      return 'bg-primary text-primary-foreground';
    case 'mantenimiento':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const getCapacidadColor = (porcentaje: number) => {
  if (porcentaje >= 90) return 'bg-destructive';
  if (porcentaje >= 70) return 'bg-warning';
  return 'bg-success';
};

const CamionStatus = ({ camion }: CamionStatusProps) => {
  const porcentajeUtilizado = (camion.volumen_utilizado / camion.capacidad_maxima_m3) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">{camion.codigo}</span>
          </div>
          <Badge className={getEstadoColor(camion.estado)}>
            {camion.estado === 'disponible' ? 'Disponible' :
             camion.estado === 'en_ruta' ? 'En Ruta' :
             camion.estado === 'mantenimiento' ? 'Mantenimiento' : camion.estado}
          </Badge>
        </div>

        {/* Conductor */}
        {camion.conductor_nombre && (
          <div className="mb-3 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{camion.conductor_nombre}</span>
            </div>
            {camion.conductor_telefono && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{camion.conductor_telefono}</span>
              </div>
            )}
          </div>
        )}

        {/* Capacidad */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Capacidad</span>
            <span className="font-medium">
              {camion.volumen_utilizado.toFixed(1)} / {camion.capacidad_maxima_m3} m³
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${getCapacidadColor(porcentajeUtilizado)}`}
              style={{ width: `${Math.min(porcentajeUtilizado, 100)}%` }}
            />
          </div>
          
          <div className="text-xs text-muted-foreground text-right">
            {porcentajeUtilizado.toFixed(1)}% utilizado
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CamionStatus;