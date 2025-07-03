import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bodega, accion, rutas_aprobadas } = await req.json();
    
    console.log(`Procesando optimización manual para bodega: ${bodega}, acción: ${accion}`);

    if (accion === 'generar_preview') {
      // Generar vista previa de rutas optimizadas
      return await generarVistaPrevia(bodega);
    } else if (accion === 'aprobar_rutas') {
      // Aprobar y asignar las rutas generadas
      return await aprobarYAsignarRutas(rutas_aprobadas);
    } else {
      throw new Error('Acción no válida. Use "generar_preview" o "aprobar_rutas"');
    }

  } catch (error) {
    console.error('Error en manual-optimize-routes-for-region:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generarVistaPrevia(bodega: string) {
  try {
    // Obtener información de la bodega
    const { data: bodegaInfo } = await supabase
      .from('bodegas')
      .select('*')
      .eq('nombre', bodega)
      .single();

    if (!bodegaInfo) {
      throw new Error(`Bodega ${bodega} no encontrada`);
    }

    // Obtener pedidos pendientes para esta bodega
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('*')
      .eq('bodega_asignada', bodega)
      .eq('estado', 'pendiente');

    // Obtener camiones disponibles para esta bodega
    const { data: camiones } = await supabase
      .from('camiones')
      .select('*')
      .eq('bodega_id', bodegaInfo.id)
      .eq('estado', 'disponible')
      .eq('activo', true);

    if (!pedidos || pedidos.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        mensaje: "No hay pedidos pendientes para optimizar en esta bodega",
        rutas_optimizadas: [],
        pedidos_no_asignados: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!camiones || camiones.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        mensaje: "No hay camiones disponibles en esta bodega",
        rutas_optimizadas: [],
        pedidos_no_asignados: pedidos.map(p => p.id)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Llamar a la función optimize-routes existente
    const { data: optimizationResult, error: optimizeError } = await supabase.functions.invoke('optimize-routes', {
      body: {
        bodega: bodega,
        fecha_planificacion: new Date().toISOString().split('T')[0],
        camiones_disponibles: camiones.map(c => c.codigo),
        pedidos_incluir: pedidos.map(p => p.id)
      }
    });

    if (optimizeError) throw optimizeError;

    // Enriquecer el resultado con información adicional para la vista previa
    const rutasEnriquecidas = await Promise.all(
      optimizationResult.rutas_optimizadas.map(async (ruta: any) => {
        const camion = camiones.find(c => c.codigo === ruta.camion_codigo);
        const pedidosDetalle = await Promise.all(
          ruta.pedidos.map(async (pedidoRuta: any) => {
            const pedido = pedidos.find(p => p.id === pedidoRuta.id);
            return {
              ...pedidoRuta,
              nombre_cliente: pedido?.nombre_cliente,
              direccion_entrega: pedido?.direccion_entrega,
              ciudad_entrega: pedido?.ciudad_entrega,
              volumen_total_m3: pedido?.volumen_total_m3,
              prioridad: pedido?.prioridad
            };
          })
        );

        return {
          ...ruta,
          camion: {
            id: camion?.id,
            codigo: camion?.codigo,
            conductor_nombre: camion?.conductor_nombre,
            conductor_telefono: camion?.conductor_telefono,
            capacidad_maxima_m3: camion?.capacidad_maxima_m3
          },
          pedidos_detalle: pedidosDetalle
        };
      })
    );

    // Obtener detalles de pedidos no asignados
    const pedidosNoAsignadosDetalle = pedidos.filter(p => 
      optimizationResult.pedidos_no_asignados.includes(p.id)
    ).map(p => ({
      id: p.id,
      nombre_cliente: p.nombre_cliente,
      direccion_entrega: p.direccion_entrega,
      volumen_total_m3: p.volumen_total_m3,
      prioridad: p.prioridad
    }));

    return new Response(JSON.stringify({
      success: true,
      preview: true,
      rutas_optimizadas: rutasEnriquecidas,
      pedidos_no_asignados: pedidosNoAsignadosDetalle,
      razon: optimizationResult.razon || "Optimización completada",
      bodega: bodega,
      fecha_generacion: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generando vista previa:', error);
    throw error;
  }
}

async function aprobarYAsignarRutas(rutasAprobadas: any[]) {
  try {
    console.log('Iniciando aprobación de rutas:', rutasAprobadas.length);
    
    const fechaProgramada = new Date().toISOString().split('T')[0];
    const rutasCreadas = [];
    const pedidosActualizados = [];

    for (const ruta of rutasAprobadas) {
      // Crear registro en rutas_entrega
      const { data: rutaCreada, error: rutaError } = await supabase
        .from('rutas_entrega')
        .insert({
          camion_id: ruta.camion.id,
          fecha_programada: fechaProgramada,
          estado: 'planificada',
          hora_inicio: ruta.pedidos_detalle[0]?.hora_estimada || '08:00',
          distancia_total_km: ruta.resumen.distancia_km,
          tiempo_estimado_horas: ruta.resumen.tiempo_horas,
          volumen_total_m3: ruta.resumen.volumen_utilizado,
          ruta_optimizada: ruta.pedidos_detalle.map(p => ({
            pedido_id: p.id,
            orden: p.orden,
            hora_estimada: p.hora_estimada,
            cliente: p.nombre_cliente,
            direccion: p.direccion_entrega
          })),
          observaciones: `Ruta optimizada manualmente - ${ruta.resumen.total_pedidos} pedidos`
        })
        .select()
        .single();

      if (rutaError) {
        console.error('Error creando ruta:', rutaError);
        throw rutaError;
      }

      rutasCreadas.push(rutaCreada);

      // Actualizar estado de pedidos a "asignado" y vincular a la ruta
      for (const pedido of ruta.pedidos_detalle) {
        const { error: pedidoError } = await supabase
          .from('pedidos')
          .update({
            estado: 'asignado',
            ruta_entrega_id: rutaCreada.id
          })
          .eq('id', pedido.id);

        if (pedidoError) {
          console.error('Error actualizando pedido:', pedidoError);
          throw pedidoError;
        }

        pedidosActualizados.push(pedido.id);
      }

      // Actualizar estado del camión a "planificado"
      const { error: camionError } = await supabase
        .from('camiones')
        .update({ estado: 'planificado' })
        .eq('id', ruta.camion.id);

      if (camionError) {
        console.error('Error actualizando camión:', camionError);
        throw camionError;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mensaje: `Se han creado ${rutasCreadas.length} rutas y asignado ${pedidosActualizados.length} pedidos`,
      rutas_creadas: rutasCreadas.length,
      pedidos_asignados: pedidosActualizados.length,
      fecha_programada: fechaProgramada
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error aprobando rutas:', error);
    throw error;
  }
}