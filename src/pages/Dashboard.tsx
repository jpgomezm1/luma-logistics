import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import PedidoCard from '@/components/PedidoCard';
import Filtros from '@/components/Filtros';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';

export interface Pedido {
  id: number;
  nombre_cliente: string;
  direccion_entrega: string;
  items: Array<{
    producto: string;
    cantidad: number;
    precio_unitario?: number;
    precio_total?: number;
  }>;
  estado: string;
  fecha_creacion: string;
  telegram_user_id?: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'despachado'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          navigate('/auth');
        }
      }
    );

    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchPedidos();
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(fetchPedidos, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    // Aplicar filtros
    let filtered = pedidos;

    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(pedido => pedido.estado === filtroEstado);
    }

    if (busqueda) {
      filtered = filtered.filter(pedido => 
        pedido.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    setFilteredPedidos(filtered);
  }, [pedidos, filtroEstado, busqueda]);

  const fetchPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      
      // Convertir Json a array de items con tipo correcto
      const pedidosFormateados: Pedido[] = (data || []).map(pedido => ({
        id: pedido.id,
        nombre_cliente: pedido.nombre_cliente,
        direccion_entrega: pedido.direccion_entrega,
        items: Array.isArray(pedido.items) ? pedido.items as Array<{
          producto: string;
          cantidad: number;
          precio_unitario?: number;
          precio_total?: number;
        }> : [],
        estado: pedido.estado || 'pendiente',
        fecha_creacion: pedido.fecha_creacion || new Date().toISOString(),
        telegram_user_id: pedido.telegram_user_id || undefined
      }));
      
      setPedidos(pedidosFormateados);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const marcarComoDespachado = async (pedidoId: number) => {
    try {
      // Optimistic update
      setPedidos(prev => 
        prev.map(pedido => 
          pedido.id === pedidoId 
            ? { ...pedido, estado: 'despachado' }
            : pedido
        )
      );

      const { error } = await supabase
        .from('pedidos')
        .update({ estado: 'despachado' })
        .eq('id', pedidoId);

      if (error) throw error;

      toast({
        title: "Pedido actualizado",
        description: "El pedido ha sido marcado como despachado",
      });
    } catch (error: any) {
      // Revertir optimistic update
      setPedidos(prev => 
        prev.map(pedido => 
          pedido.id === pedidoId 
            ? { ...pedido, estado: 'pendiente' }
            : pedido
        )
      );
      
      toast({
        title: "Error",
        description: "No se pudo actualizar el pedido",
        variant: "destructive",
      });
    }
  };

  const calcularEstadisticas = () => {
    const total = pedidos.length;
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const despachados = pedidos.filter(p => p.estado === 'despachado').length;
    
    return { total, pendientes, despachados };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = calcularEstadisticas();

  return (
    <DashboardLayout>
      <div className="bg-muted/30 min-h-full">
        <Header 
          user={user} 
          stats={stats}
          onLogout={() => supabase.auth.signOut()}
        />
        
        <main className="container mx-auto px-4 py-6">
          <Filtros
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            totalResultados={filteredPedidos.length}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPedidos.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onMarcarDespachado={marcarComoDespachado}
              />
            ))}
          </div>

          {filteredPedidos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {busqueda || filtroEstado !== 'todos' 
                  ? 'No se encontraron pedidos con los filtros aplicados'
                  : 'No hay pedidos registrados'
                }
              </p>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;