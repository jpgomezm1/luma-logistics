import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, User, CheckCircle, Truck, Calendar, Hash, ShoppingBag, ArrowRight } from 'lucide-react';
import { Pedido } from '@/pages/Dashboard';

interface PedidoCardProps {
  pedido: Pedido;
  onMarcarDespachado: (pedidoId: number) => void;
  viewMode?: 'grid' | 'list' | 'compact';
}

const PedidoCard = ({ pedido, onMarcarDespachado, viewMode = 'grid' }: PedidoCardProps) => {
  const formatearFechaHora = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatearFechaRelativa = (fecha: string) => {
    const ahora = new Date();
    const fechaPedido = new Date(fecha);
    const diffMs = ahora.getTime() - fechaPedido.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffHoras < 1) return 'Hace menos de 1h';
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return formatearFechaHora(fecha);
  };

  const extraerCiudad = (direccion: string) => {
    const ciudadMatch = direccion.match(/,\s*([^,]+)$/);
    return ciudadMatch ? ciudadMatch[1].trim() : 'Medellín';
  };

  const extraerDireccionCorta = (direccion: string) => {
    const partes = direccion.split(',');
    return partes[0].trim();
  };

  const contarProductos = () => {
    return pedido.items.reduce((total, item) => total + item.cantidad, 0);
  };

  const getEstadoBadge = () => {
    if (pedido.estado === 'despachado') {
      return (
        <Badge className="bg-emerald-500 text-white border-0 font-medium">
          <CheckCircle className="w-3 h-3 mr-1.5" />
          Despachado
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500 text-white border-0 font-medium">
        <Clock className="w-3 h-3 mr-1.5" />
        Pendiente
      </Badge>
    );
  };

  const getUrgenciaBadge = () => {
    const horasTranscurridas = Math.floor((new Date().getTime() - new Date(pedido.fecha_creacion).getTime()) / (1000 * 60 * 60));
    
    if (pedido.estado === 'pendiente' && horasTranscurridas > 24) {
      return (
        <Badge variant="destructive" className="text-xs font-medium">
          Urgente
        </Badge>
      );
    }
    return null;
  };

  const getCardStyles = () => {
    if (pedido.estado === 'despachado') {
      return {
        border: 'border-l-4 border-l-emerald-500',
        header: 'bg-emerald-50 border-b border-emerald-100',
        accent: 'text-emerald-700'
      };
    }
    return {
      border: 'border-l-4 border-l-amber-500',
      header: 'bg-amber-50 border-b border-amber-100',
      accent: 'text-amber-700'
    };
  };

  const styles = getCardStyles();

  // Vista Compacta (Nueva)
  if (viewMode === 'compact') {
    return (
      <Card className={`group hover:shadow-lg transition-all duration-300 ${styles.border} bg-white`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* ID y básicos */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="font-bold text-slate-700 text-sm">
                  #{pedido.id.toString().padStart(3, '0')}
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 text-sm">{pedido.nombre_cliente}</p>
                <p className="text-xs text-slate-500">{extraerCiudad(pedido.direccion_entrega)}</p>
              </div>
            </div>

            {/* Info central */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{contarProductos()} productos</span>
              </div>
              <span className="text-slate-500">{formatearFechaRelativa(pedido.fecha_creacion)}</span>
            </div>

            {/* Estado y acción */}
            <div className="flex items-center gap-2">
              {getUrgenciaBadge()}
              {getEstadoBadge()}
              {pedido.estado === 'pendiente' && (
                <Button
                  onClick={() => onMarcarDespachado(pedido.id)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Truck className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vista Grid (Simplificada)
  if (viewMode === 'grid') {
    return (
      <Card className={`group h-full flex flex-col hover:shadow-xl transition-all duration-300 ${styles.border} bg-white`}>
        {/* Header simplificado */}
        <CardHeader className={`${styles.header} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Hash className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Pedido #{pedido.id.toString().padStart(4, '0')}
                </h3>
                <p className="text-sm text-slate-500">{formatearFechaRelativa(pedido.fecha_creacion)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getUrgenciaBadge()}
              {getEstadoBadge()}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-4 space-y-4">
          {/* Información del cliente */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">{pedido.nombre_cliente}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">{extraerCiudad(pedido.direccion_entrega)}</p>
                <p className="text-sm text-slate-500">{extraerDireccionCorta(pedido.direccion_entrega)}</p>
              </div>
            </div>
          </div>

          {/* Productos simplificados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-800">Productos a preparar</span>
              </div>
              <Badge variant="secondary" className="text-sm">
                {contarProductos()} unidades
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {pedido.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{item.producto}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-100 text-slate-700 font-medium">
                      <ShoppingBag className="w-3 h-3 mr-1" />
                      {item.cantidad}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de acción */}
          {pedido.estado === 'pendiente' && (
            <Button
              onClick={() => onMarcarDespachado(pedido.id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
            >
              <Truck className="w-4 h-4 mr-2" />
              Marcar como Despachado
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {pedido.estado === 'despachado' && (
            <div className="w-full bg-emerald-50 text-emerald-700 font-medium py-3 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Pedido Despachado
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Vista List (Horizontal compacta)
  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${styles.border} bg-white`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-6">
          {/* Info principal */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
              <span className="font-bold text-slate-700">
                #{pedido.id.toString().padStart(3, '0')}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">{pedido.nombre_cliente}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {extraerCiudad(pedido.direccion_entrega)}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {contarProductos()} productos
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatearFechaRelativa(pedido.fecha_creacion)}
                </span>
              </div>
            </div>
          </div>

          {/* Estado y acciones */}
          <div className="flex items-center gap-3">
            {getUrgenciaBadge()}
            {getEstadoBadge()}
            
            {pedido.estado === 'pendiente' ? (
              <Button
                onClick={() => onMarcarDespachado(pedido.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2"
              >
                <Truck className="w-4 h-4 mr-2" />
                Despachar
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium text-sm">Despachado</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PedidoCard;