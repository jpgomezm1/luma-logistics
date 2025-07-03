// components/RevisionPedidosDialog.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  Package, 
  ShoppingBag,
  X,
  Eye,
  Truck
} from 'lucide-react';
import { Pedido } from '@/pages/Dashboard';

interface RevisionPedidosDialogProps {
  pedidos: Pedido[];
  filteredPedidos: Pedido[];
  onMarcarDespachado: (pedidoId: number) => void;
}

const RevisionPedidosDialog = ({ pedidos, filteredPedidos, onMarcarDespachado }: RevisionPedidosDialogProps) => {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revisados, setRevisados] = useState<Set<number>>(new Set());

  // Solo mostrar pedidos pendientes para revisión
  const pedidosParaRevisar = filteredPedidos.filter(p => p.estado === 'pendiente');

  useEffect(() => {
    if (open && pedidosParaRevisar.length > 0) {
      setCurrentIndex(0);
    }
  }, [open, pedidosParaRevisar.length]);

  const pedidoActual = pedidosParaRevisar[currentIndex];

  const nextPedido = () => {
    if (currentIndex < pedidosParaRevisar.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevPedido = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const marcarComoRevisado = (pedidoId: number) => {
    setRevisados(prev => new Set(prev).add(pedidoId));
  };

  const desmarcarRevisado = (pedidoId: number) => {
    setRevisados(prev => {
      const newSet = new Set(prev);
      newSet.delete(pedidoId);
      return newSet;
    });
  };

  const handleDespachar = () => {
    if (pedidoActual) {
      onMarcarDespachado(pedidoActual.id);
      nextPedido();
    }
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
    return fechaPedido.toLocaleDateString('es-CO');
  };

  const extraerCiudad = (direccion: string) => {
    const ciudadMatch = direccion.match(/,\s*([^,]+)$/);
    return ciudadMatch ? ciudadMatch[1].trim() : 'Medellín';
  };

  const contarProductos = (pedido: Pedido) => {
    return pedido.items.reduce((total, item) => total + item.cantidad, 0);
  };

  const esUrgente = (fecha: string) => {
    const horasTranscurridas = Math.floor((new Date().getTime() - new Date(fecha).getTime()) / (1000 * 60 * 60));
    return horasTranscurridas > 24;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPedido();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPedido();
          break;
        case 'Enter':
          e.preventDefault();
          if (pedidoActual && !revisados.has(pedidoActual.id)) {
            marcarComoRevisado(pedidoActual.id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, pedidoActual, revisados]);

  const pedidosRevisados = Array.from(revisados).length;
  const progreso = pedidosParaRevisar.length > 0 ? (pedidosRevisados / pedidosParaRevisar.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200"
        >
          <Eye className="w-4 h-4 mr-2" />
          Modo Revisión
          {pedidosParaRevisar.length > 0 && (
            <Badge className="ml-2 bg-emerald-600 text-white">
              {pedidosParaRevisar.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              Revisión de Pedidos
            </div>
            {pedidosParaRevisar.length > 0 && (
              <Badge variant="secondary">
                {currentIndex + 1} de {pedidosParaRevisar.length}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Revisa pedido por pedido. Usa las flechas del teclado para navegar rápidamente.
          </DialogDescription>
        </DialogHeader>

        {pedidosParaRevisar.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">¡Todo revisado!</h3>
              <p className="text-slate-600">No hay pedidos pendientes para revisar con los filtros aplicados.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Progreso de revisión</span>
                <span className="font-medium text-slate-800">{pedidosRevisados}/{pedidosParaRevisar.length}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progreso}%` }}
                ></div>
              </div>
            </div>

            {/* Pedido actual */}
            {pedidoActual && (
              <div className="flex-1 overflow-y-auto">
                <Card className={`border-l-4 ${
                  revisados.has(pedidoActual.id) 
                    ? 'border-l-emerald-500 bg-emerald-50/50' 
                    : esUrgente(pedidoActual.fecha_creacion)
                      ? 'border-l-red-500 bg-red-50/50'
                      : 'border-l-amber-500 bg-amber-50/50'
                }`}>
                  <CardContent className="p-6 space-y-6">
                    {/* Header del pedido */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                          <span className="font-bold text-slate-700">
                            #{pedidoActual.id.toString().padStart(3, '0')}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Pedido #{pedidoActual.id}</h3>
                          <p className="text-sm text-slate-500">{formatearFechaRelativa(pedidoActual.fecha_creacion)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {esUrgente(pedidoActual.fecha_creacion) && (
                          <Badge variant="destructive" className="animate-pulse">
                            Urgente
                          </Badge>
                        )}
                        {revisados.has(pedidoActual.id) && (
                          <Badge className="bg-emerald-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Revisado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Información del cliente */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-slate-800">{pedidoActual.nombre_cliente}</p>
                            <p className="text-sm text-slate-600">Cliente</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-700">{extraerCiudad(pedidoActual.direccion_entrega)}</p>
                            <p className="text-sm text-slate-600">{pedidoActual.direccion_entrega}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-slate-800">Productos a preparar</span>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700">
                          {contarProductos(pedidoActual)} unidades
                        </Badge>
                      </div>
                      
                      <div className="grid gap-3">
                        {pedidoActual.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="font-medium text-slate-800">{item.producto}</span>
                            </div>
                            <Badge className="bg-slate-200 text-slate-700">
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              {item.cantidad}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Controles de navegación y acciones */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={prevPedido}
                  disabled={currentIndex === 0}
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={nextPedido}
                  disabled={currentIndex === pedidosParaRevisar.length - 1}
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {pedidoActual && (
                  <>
                    {revisados.has(pedidoActual.id) ? (
                      <Button
                        variant="outline"
                        onClick={() => desmarcarRevisado(pedidoActual.id)}
                        className="text-slate-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Desmarcar
                      </Button>
                    ) : (
                      <Button
                        onClick={() => marcarComoRevisado(pedidoActual.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar Revisado
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleDespachar}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Despachar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RevisionPedidosDialog;