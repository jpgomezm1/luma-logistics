import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

interface FiltrosProps {
  filtroEstado: 'todos' | 'pendiente' | 'despachado';
  onFiltroChange: (filtro: 'todos' | 'pendiente' | 'despachado') => void;
  busqueda: string;
  onBusquedaChange: (busqueda: string) => void;
  totalResultados: number;
}

const Filtros = ({
  filtroEstado,
  onFiltroChange,
  busqueda,
  onBusquedaChange,
  totalResultados,
}: FiltrosProps) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <Tabs value={filtroEstado} onValueChange={onFiltroChange as any}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
            <TabsTrigger value="despachado">Despachados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="pl-10 w-full md:w-64"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Mostrando {totalResultados} resultado{totalResultados !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default Filtros;