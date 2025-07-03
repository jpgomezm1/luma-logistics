// components/ListaPreparacionDialog.tsx
import { useState } from 'react';
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
import { Separator } from "@/components/ui/separator";
import { Package, ShoppingBag, MapPin, User, CheckCircle, Clock, Printer, Download } from 'lucide-react';
import { Pedido } from '@/pages/Dashboard';

interface ListaPreparacionDialogProps {
  pedidos: Pedido[];
  filteredPedidos: Pedido[];
}

interface ProductoConsolidado {
  producto: string;
  cantidadTotal: number;
  pedidos: Array<{
    id: number;
    cliente: string;
    cantidad: number;
    region: string;
  }>;
}

const ListaPreparacionDialog = ({ pedidos, filteredPedidos }: ListaPreparacionDialogProps) => {
  const [open, setOpen] = useState(false);

  const consolidarProductos = (): ProductoConsolidado[] => {
    const productosMap = new Map<string, ProductoConsolidado>();

    // Solo considerar pedidos pendientes de los filtrados
    const pedidosPendientes = filteredPedidos.filter(p => p.estado === 'pendiente');

    pedidosPendientes.forEach(pedido => {
      const region = pedido.direccion_entrega.match(/,\s*([^,]+)$/)?.[1]?.trim() || 'Medellín';
      
      pedido.items.forEach(item => {
        const key = item.producto.toLowerCase();
        
        if (productosMap.has(key)) {
          const existing = productosMap.get(key)!;
          existing.cantidadTotal += item.cantidad;
          existing.pedidos.push({
            id: pedido.id,
            cliente: pedido.nombre_cliente,
            cantidad: item.cantidad,
            region
          });
        } else {
          productosMap.set(key, {
            producto: item.producto,
            cantidadTotal: item.cantidad,
            pedidos: [{
              id: pedido.id,
              cliente: pedido.nombre_cliente,
              cantidad: item.cantidad,
              region
            }]
          });
        }
      });
    });

    return Array.from(productosMap.values()).sort((a, b) => b.cantidadTotal - a.cantidadTotal);
  };

  const productosConsolidados = consolidarProductos();
  const totalProductos = productosConsolidados.reduce((sum, p) => sum + p.cantidadTotal, 0);
  const totalPedidos = filteredPedidos.filter(p => p.estado === 'pendiente').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
        >
          <Package className="w-4 h-4 mr-2" />
          Lista de Preparación
          {totalProductos > 0 && (
            <Badge className="ml-2 bg-blue-600 text-white">
              {totalProductos}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            Lista de Preparación de Productos
          </DialogTitle>
          <DialogDescription>
            Productos consolidados para preparar según los filtros aplicados
          </DialogDescription>
        </DialogHeader>

        {/* Estadísticas de la lista */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-900">{productosConsolidados.length}</p>
            <p className="text-sm text-blue-600">Productos únicos</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-900">{totalProductos}</p>
            <p className="text-sm text-amber-600">Unidades totales</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-900">{totalPedidos}</p>
            <p className="text-sm text-emerald-600">Pedidos pendientes</p>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {productosConsolidados.length > 0 ? (
            productosConsolidados.map((producto, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{producto.producto}</h3>
                      <p className="text-sm text-slate-500">{producto.pedidos.length} pedido{producto.pedidos.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                    {producto.cantidadTotal} unidades
                  </Badge>
                </div>

                {/* Desglose por pedidos */}
                <div className="space-y-2">
                  <Separator />
                  <div className="grid gap-2">
                    {producto.pedidos.map((pedidoInfo, pidx) => (
                      <div key={pidx} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="font-medium text-slate-700">#{pedidoInfo.id.toString().padStart(3, '0')}</span>
                          <span className="text-slate-600">{pedidoInfo.cliente}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-600">{pedidoInfo.region}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {pedidoInfo.cantidad}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No hay productos para preparar con los filtros aplicados</p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-slate-600">
            Lista generada: {new Date().toLocaleString('es-CO')}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListaPreparacionDialog;