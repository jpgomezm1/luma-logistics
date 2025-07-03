import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function calcularNuevoETA(rutaOptimizada: any[], pedidoCompletado: number): any[] {
  const ahora = new Date();
  let tiempoAcumulado = 30; // 30 minutos desde ahora
  
  return rutaOptimizada.map(pedido => {
    if (pedido.id === pedidoCompletado || pedido.completado) {
      return { ...pedido, completado: true };
    }
    
    // Calcular nueva hora estimada
    const nuevaHora = new Date(ahora.getTime() + tiempoAcumulado * 60000);
    tiempoAcumulado += 45; // 45 minutos promedio por entrega
    
    return {
      ...pedido,
      hora_estimada: nuevaHora.toTimeString().substring(0, 5)
    };
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ruta_id, accion, pedido_id, observaciones } = await req.json();
    
    console.log(`Actualizando ruta ${ruta_id}: ${accion}`);

    // Obtener la ruta actual
    const { data: ruta, error: rutaError } = await supabase
      .from('rutas_entrega')
      .select('*')
      .eq('id', ruta_id)
      .single();

    if (rutaError || !ruta) {
      throw new Error(`Ruta ${ruta_id} no encontrada`);
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (accion) {
      case 'iniciar_ruta':
        updateData.estado = 'en_curso';
        updateData.hora_inicio = new Date().toTimeString().substring(0, 8);
        
        // Actualizar estado del camión
        await supabase
          .from('camiones')
          .update({ estado: 'en_ruta' })
          .eq('id', ruta.camion_id);
        
        console.log(`Ruta ${ruta_id} iniciada`);
        break;

      case 'pedido_entregado':
        if (!pedido_id) {
          throw new Error('pedido_id es requerido para marcar como entregado');
        }

        // Actualizar estado del pedido
        await supabase
          .from('pedidos')
          .update({ 
            estado: 'entregado',
            observaciones_logistica: observaciones || 'Entregado exitosamente'
          })
          .eq('id', pedido_id);

        // Recalcular ETAs para entregas restantes
        const rutaActualizada = calcularNuevoETA(ruta.ruta_optimizada as any[], pedido_id);
        updateData.ruta_optimizada = rutaActualizada;

        console.log(`Pedido ${pedido_id} marcado como entregado`);
        break;

      case 'pedido_fallido':
        if (!pedido_id) {
          throw new Error('pedido_id es requerido para marcar como fallido');
        }

        // Actualizar estado del pedido
        await supabase
          .from('pedidos')
          .update({ 
            estado: 'fallido',
            observaciones_logistica: observaciones || 'Entrega fallida'
          })
          .eq('id', pedido_id);

        // Recalcular ETAs para entregas restantes
        const rutaFallida = calcularNuevoETA(ruta.ruta_optimizada as any[], pedido_id);
        updateData.ruta_optimizada = rutaFallida;

        console.log(`Pedido ${pedido_id} marcado como fallido`);
        break;

      case 'finalizar_ruta':
        updateData.estado = 'completada';
        updateData.hora_fin_estimada = new Date().toTimeString().substring(0, 8);
        
        // Actualizar estado del camión
        await supabase
          .from('camiones')
          .update({ estado: 'disponible' })
          .eq('id', ruta.camion_id);

        // Marcar como completados todos los pedidos restantes
        const pedidosPendientes = (ruta.ruta_optimizada as any[])
          .filter(p => !p.completado)
          .map(p => p.id);

        if (pedidosPendientes.length > 0) {
          await supabase
            .from('pedidos')
            .update({ 
              estado: 'entregado',
              observaciones_logistica: 'Ruta finalizada - entrega confirmada'
            })
            .in('id', pedidosPendientes);
        }

        console.log(`Ruta ${ruta_id} finalizada`);
        break;

      default:
        throw new Error(`Acción '${accion}' no reconocida`);
    }

    // Agregar observaciones si se proporcionan
    if (observaciones) {
      updateData.observaciones = observaciones;
    }

    // Actualizar la ruta
    const { data: rutaActualizada, error: updateError } = await supabase
      .from('rutas_entrega')
      .update(updateData)
      .eq('id', ruta_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Obtener estadísticas actualizadas de la ruta
    const { data: pedidosRuta } = await supabase
      .from('pedidos')
      .select('estado')
      .eq('ruta_entrega_id', ruta_id);

    const estadisticas = {
      total_pedidos: pedidosRuta?.length || 0,
      entregados: pedidosRuta?.filter(p => p.estado === 'entregado').length || 0,
      fallidos: pedidosRuta?.filter(p => p.estado === 'fallido').length || 0,
      pendientes: pedidosRuta?.filter(p => p.estado === 'asignado').length || 0
    };

    const resultado = {
      ruta_actualizada: rutaActualizada,
      accion_ejecutada: accion,
      pedido_afectado: pedido_id,
      estadisticas,
      timestamp: new Date().toISOString()
    };

    console.log('Actualización de ruta completada:', resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en update-route-status:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});