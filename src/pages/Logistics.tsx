import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import BodegaCard from '@/components/logistics/BodegaCard';
import AlertasPanel from '@/components/logistics/AlertasPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';

export interface BodegaEstadisticas {
  id: number;
  nombre: string;
  departamento: string;
  max_dias_entrega: number;
  pedidos_pendientes: number;
  total_camiones: number;
  volumen_pendiente: number;
  pedidos_urgentes: number;
  capacidad_disponible: number;
}

const Logistics = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bodegas, setBodegas] = useState<BodegaEstadisticas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      fetchBodegasData();
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(fetchBodegasData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchBodegasData = async () => {
    try {
      setIsLoading(true);

      // Obtener todas las bodegas
      const { data: bodegasData, error: bodegasError } = await supabase
        .from('bodegas')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (bodegasError) throw bodegasError;

      // Obtener estadísticas para cada bodega
      const bodegasEstadisticas: BodegaEstadisticas[] = [];

      for (const bodega of bodegasData || []) {
        // Pedidos pendientes
        const { data: pedidosPendientes } = await supabase
          .from('pedidos')
          .select('volumen_total_m3, prioridad, fecha_limite_entrega')
          .eq('bodega_asignada', bodega.nombre)
          .eq('estado', 'pendiente');

        // Camiones de la bodega
        const { data: camiones } = await supabase
          .from('camiones')
          .select('capacidad_maxima_m3, estado')
          .eq('bodega_id', bodega.id)
          .eq('activo', true);

        const volumenPendiente = pedidosPendientes?.reduce((sum, p) => sum + (p.volumen_total_m3 || 0), 0) || 0;
        const pedidosUrgentes = pedidosPendientes?.filter(p => {
          const fechaLimite = new Date(p.fecha_limite_entrega);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          return diasRestantes <= 1 || p.prioridad >= 3;
        }).length || 0;

        const capacidadTotal = camiones?.reduce((sum, c) => sum + c.capacidad_maxima_m3, 0) || 0;
        const capacidadDisponible = capacidadTotal - volumenPendiente;

        bodegasEstadisticas.push({
          id: bodega.id,
          nombre: bodega.nombre,
          departamento: bodega.departamento,
          max_dias_entrega: bodega.max_dias_entrega,
          pedidos_pendientes: pedidosPendientes?.length || 0,
          total_camiones: camiones?.length || 0,
          volumen_pendiente: volumenPendiente,
          pedidos_urgentes: pedidosUrgentes,
          capacidad_disponible: capacidadDisponible
        });
      }

      setBodegas(bodegasEstadisticas);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de las bodegas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = {
    total: bodegas.reduce((sum, b) => sum + b.pedidos_pendientes, 0),
    pendientes: bodegas.reduce((sum, b) => sum + b.pedidos_pendientes, 0),
    despachados: 0
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header 
        user={user} 
        stats={stats}
        onLogout={() => supabase.auth.signOut()}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <AlertasPanel bodegas={bodegas} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bodegas.map((bodega) => (
            <BodegaCard
              key={bodega.id}
              bodega={bodega}
              onVerDetalle={(id) => navigate(`/logistics/bodega/${id}`)}
              onPlanificarRutas={(id) => navigate(`/logistics/planificar/${id}`)}
            />
          ))}
        </div>

        {bodegas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No hay bodegas configuradas
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Logistics;