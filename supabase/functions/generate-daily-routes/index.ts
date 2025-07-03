import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando generación automática de rutas diarias');
    
    const hoy = new Date().toISOString().split('T')[0];
    const resultados = [];

    // Obtener todas las bodegas activas
    const { data: bodegas } = await supabase
      .from('bodegas')
      .select('*')
      .eq('activo', true);

    if (!bodegas) {
      throw new Error('No se pudieron obtener las bodegas');
    }

    // Procesar cada bodega
    for (const bodega of bodegas) {
      console.log(`Procesando bodega: ${bodega.nombre}`);

      // 1. Obtener pedidos pendientes dentro de ventana de tiempo
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + bodega.max_dias_entrega);
      
      const { data: pedidosPendientes } = await supabase
        .from('pedidos')
        .select('*')
        .eq('bodega_asignada', bodega.nombre)
        .eq('estado', 'pendiente')
        .lte('fecha_limite_entrega', fechaLimite.toISOString().split('T')[0])
        .order('prioridad', { ascending: false })
        .order('fecha_limite_entrega', { ascending: true });

      if (!pedidosPendientes || pedidosPendientes.length === 0) {
        console.log(`No hay pedidos pendientes para ${bodega.nombre}`);
        continue;
      }

      // 2. Identificar camiones disponibles
      const { data: camionesDisponibles } = await supabase
        .from('camiones')
        .select('*')
        .eq('bodega_id', bodega.id)
        .eq('estado', 'disponible')
        .eq('activo', true);

      if (!camionesDisponibles || camionesDisponibles.length === 0) {
        console.log(`No hay camiones disponibles para ${bodega.nombre}`);
        continue;
      }

      // 3. Llamar a optimize-routes automáticamente
      const optimizationRequest = {
        bodega: bodega.nombre,
        fecha_planificacion: hoy,
        camiones_disponibles: camionesDisponibles.map(c => c.codigo),
        pedidos_incluir: pedidosPendientes.map(p => p.id)
      };

      const optimizeResponse = await supabase.functions.invoke('optimize-routes', {
        body: optimizationRequest
      });

      if (optimizeResponse.error) {
        console.error(`Error optimizando rutas para ${bodega.nombre}:`, optimizeResponse.error);
        continue;
      }

      const optimizationResult = optimizeResponse.data;

      // 4. Crear registros en rutas_entrega
      const rutasCreadas = [];
      
      for (const ruta of optimizationResult.rutas_optimizadas || []) {
        const camion = camionesDisponibles.find(c => c.codigo === ruta.camion_codigo);
        
        if (!camion) continue;

        const { data: nuevaRuta, error: rutaError } = await supabase
          .from('rutas_entrega')
          .insert({
            camion_id: camion.id,
            fecha_programada: hoy,
            estado: 'planificada',
            volumen_total_m3: ruta.resumen.volumen_utilizado,
            distancia_total_km: ruta.resumen.distancia_km,
            tiempo_estimado_horas: ruta.resumen.tiempo_horas,
            hora_inicio: '08:00:00',
            ruta_optimizada: ruta.pedidos,
            observaciones: `Ruta generada automáticamente - ${ruta.resumen.total_pedidos} pedidos`
          })
          .select()
          .single();

        if (rutaError) {
          console.error(`Error creando ruta para camión ${ruta.camion_codigo}:`, rutaError);
          continue;
        }

        rutasCreadas.push(nuevaRuta);

        // 5. Actualizar estado de pedidos asignados
        const pedidosRuta = ruta.pedidos.map(p => p.id);
        
        const { error: updateError } = await supabase
          .from('pedidos')
          .update({ 
            estado: 'asignado',
            ruta_entrega_id: nuevaRuta.id,
            observaciones_logistica: `Asignado a ruta ${nuevaRuta.id} - Camión ${ruta.camion_codigo}`
          })
          .in('id', pedidosRuta);

        if (updateError) {
          console.error(`Error actualizando pedidos para ruta ${nuevaRuta.id}:`, updateError);
        }

        // Actualizar estado del camión
        await supabase
          .from('camiones')
          .update({ estado: 'en_ruta' })
          .eq('id', camion.id);
      }

      resultados.push({
        bodega: bodega.nombre,
        pedidos_procesados: pedidosPendientes.length,
        camiones_utilizados: rutasCreadas.length,
        rutas_creadas: rutasCreadas.map(r => r.id),
        pedidos_no_asignados: optimizationResult.pedidos_no_asignados || []
      });
    }

    const resumenTotal = {
      fecha: hoy,
      bodegas_procesadas: resultados.length,
      rutas_totales_creadas: resultados.reduce((sum, r) => sum + r.camiones_utilizados, 0),
      pedidos_totales_asignados: resultados.reduce((sum, r) => sum + r.pedidos_procesados - r.pedidos_no_asignados.length, 0),
      detalles_por_bodega: resultados
    };

    console.log('Generación de rutas completada:', resumenTotal);

    return new Response(JSON.stringify(resumenTotal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en generate-daily-routes:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fecha: new Date().toISOString().split('T')[0]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});