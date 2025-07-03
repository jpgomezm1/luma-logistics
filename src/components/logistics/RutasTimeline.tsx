import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Truck, Package } from 'lucide-react';
import { Ruta } from '@/pages/BodegaDashboard';

interface RutasTimelineProps {
  rutas: Ruta[];
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'planificada':
      return 'bg-warning text-warning-foreground';
    case 'en_curso':
      return 'bg-primary text-primary-foreground';
    case 'completada':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const getEstadoTexto = (estado: string) => {
  switch (estado) {
    case 'planificada':
      return 'Planificada';
    case 'en_curso':
      return 'En Curso';
    case 'completada':
      return 'Completada';
    default:
      return estado;
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

const RutasTimeline = ({ rutas }: RutasTimelineProps) => {
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

  const RutaItem = ({ ruta }: { ruta: Ruta }) => (
    <div className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        <Truck className="h-5 w-5 text-primary" />
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{ruta.camion.codigo}</span>
          <Badge className={getEstadoColor(ruta.estado)}>
            {getEstadoTexto(ruta.estado)}
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {ruta.camion.conductor_nombre}
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {ruta.pedidos_count} pedidos
          </span>
          <span>
            Vol: {ruta.volumen_total_m3.toFixed(1)} m³
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline de Rutas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rutas de hoy */}
        <div>
          <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            Hoy ({rutasHoy.length})
          </h3>
          <div className="space-y-2">
            {rutasHoy.map((ruta) => (
              <RutaItem key={ruta.id} ruta={ruta} />
            ))}
            {rutasHoy.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No hay rutas programadas para hoy
              </div>
            )}
          </div>
        </div>

        {/* Rutas de mañana */}
        <div>
          <h3 className="font-medium text-sm flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4" />
            Mañana ({rutasMañana.length})
          </h3>
          <div className="space-y-2">
            {rutasMañana.map((ruta) => (
              <RutaItem key={ruta.id} ruta={ruta} />
            ))}
            {rutasMañana.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No hay rutas programadas para mañana
              </div>
            )}
          </div>
        </div>

        {rutas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay rutas programadas
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RutasTimeline;