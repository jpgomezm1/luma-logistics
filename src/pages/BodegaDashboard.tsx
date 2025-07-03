import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import Header from '@/components/Header';
import CamionStatus from '@/components/logistics/CamionStatus';
import PedidosTable from '@/components/logistics/PedidosTable';
import RutasTimeline from '@/components/logistics/RutasTimeline';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface Camion {
  id: number;
  codigo: string;
  capacidad_maxima_m3: number;
  estado: string;
  conductor_nombre: string;
  conductor_telefono: string;
  volumen_utilizado: number;
}

export interface Ruta {
  id: number;
  fecha_programada: string;
  estado: string;
  volumen_total_m3: number;
  camion: {
    codigo: string;
    conductor_nombre: string;
  };
  pedidos_count: number;
}

const BodegaDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [bodega, setBodega] = useState<any>(null);
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { bodegaId } = useParams();

  useEffect(() => {
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
    if (user && bodegaId) {
      fetchBodegaData();
    }
  }, [user, bodegaId]);

  const fetchBodegaData = async () => {
    try {
      setIsLoading(true);

      // Obtener información de la bodega
      const { data: bodegaData, error: bodegaError } = await supabase
        .from('bodegas')
        .select('*')
        .eq('id', Number(bodegaId))
        .single();

      if (bodegaError) throw bodegaError;
      setBodega(bodegaData);

      // Obtener camiones
      const { data: camionesData } = await supabase
        .from('camiones')
        .select('*')
        .eq('bodega_id', Number(bodegaId))
        .eq('activo', true);

      // Calcular volumen utilizado por cada camión
      const camionesConVolumen: Camion[] = [];
      for (const camion of camionesData || []) {
        const { data: rutasActivas } = await supabase
          .from('rutas_entrega')
          .select('volumen_total_m3')
          .eq('camion_id', camion.id)
          .in('estado', ['planificada', 'en_curso']);

        const volumenUtilizado = rutasActivas?.reduce((sum, r) => sum + (r.volumen_total_m3 || 0), 0) || 0;

        camionesConVolumen.push({
          ...camion,
          volumen_utilizado: volumenUtilizado
        });
      }
      setCamiones(camionesConVolumen);

      // Obtener rutas programadas (hoy y mañana)
      const hoy = new Date().toISOString().split('T')[0];
      const manana = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: rutasData } = await supabase
        .from('rutas_entrega')
        .select(`
          *,
          camiones!inner(codigo, conductor_nombre, bodega_id)
        `)
        .eq('camiones.bodega_id', Number(bodegaId))
        .gte('fecha_programada', hoy)
        .lte('fecha_programada', manana)
        .order('fecha_programada');

      // Obtener conteo de pedidos por ruta
      const rutasConPedidos: Ruta[] = [];
      for (const ruta of rutasData || []) {
        const { count } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('ruta_entrega_id', ruta.id);

        rutasConPedidos.push({
          id: ruta.id,
          fecha_programada: ruta.fecha_programada,
          estado: ruta.estado,
          volumen_total_m3: ruta.volumen_total_m3 || 0,
          camion: {
            codigo: ruta.camiones.codigo,
            conductor_nombre: ruta.camiones.conductor_nombre
          },
          pedidos_count: count || 0
        });
      }
      setRutas(rutasConPedidos);

      // Obtener pedidos pendientes
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*')
        .eq('bodega_asignada', bodegaData.nombre)
        .eq('estado', 'pendiente')
        .order('prioridad', { ascending: false })
        .order('fecha_creacion', { ascending: true });

      setPedidosPendientes(pedidos || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la bodega",
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
    total: pedidosPendientes.length,
    pendientes: pedidosPendientes.length,
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
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/logistics')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bodega {bodega?.nombre}
            </h1>
            <p className="text-muted-foreground">
              {bodega?.departamento} • Max. entrega: {bodega?.max_dias_entrega} días
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Camiones */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Flota de Camiones</h2>
            <div className="space-y-4">
              {camiones.map((camion) => (
                <CamionStatus key={camion.id} camion={camion} />
              ))}
            </div>
          </div>

          {/* Rutas Timeline */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Rutas Programadas</h2>
            <RutasTimeline rutas={rutas} />
          </div>
        </div>

        {/* Pedidos pendientes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Pedidos Pendientes ({pedidosPendientes.length})
          </h2>
          <PedidosTable 
            pedidos={pedidosPendientes} 
            onAsignarRuta={(pedidoIds) => {
              // Navegar al planificador con pedidos preseleccionados
              navigate(`/logistics/planificar/${bodegaId}?pedidos=${pedidoIds.join(',')}`);
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default BodegaDashboard;