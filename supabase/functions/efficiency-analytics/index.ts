import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function getWeekNumber(date: Date): string {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil(days / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

function calcularFechasSemana(): { inicioSemana: string, finSemana: string } {
  const ahora = new Date();
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() - ahora.getDay()); // Domingo
  
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6); // Sábado
  
  return {
    inicioSemana: inicioSemana.toISOString().split('T')[0],
    finSemana: finSemana.toISOString().split('T')[0]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generando reporte de eficiencia semanal');
    
    const { inicioSemana, finSemana } = calcularFechasSemana();
    const semana = getWeekNumber(new Date());
    
    console.log(`Analizando semana ${semana}: ${inicioSemana} a ${finSemana}`);

    // Obtener todas las bodegas
    const { data: bodegas } = await supabase
      .from('bodegas')
      .select('*')
      .eq('activo', true);

    if (!bodegas) {
      throw new Error('No se pudieron obtener las bodegas');
    }

    const reportePorBodega: Record<string, any> = {};
    const alertas: string[] = [];

    // Analizar cada bodega
    for (const bodega of bodegas) {
      console.log(`Analizando bodega: ${bodega.nombre}`);

      // Obtener pedidos de la semana
      const { data: pedidosSemana } = await supabase
        .from('pedidos')
        .select('*')
        .eq('bodega_asignada', bodega.nombre)
        .gte('fecha_creacion', inicioSemana)
        .lte('fecha_creacion', finSemana);

      // Obtener rutas de la semana
      const { data: rutasSemana } = await supabase
        .from('rutas_entrega')
        .select(`
          *,
          camiones!inner(bodega_id)
        `)
        .eq('camiones.bodega_id', bodega.id)
        .gte('fecha_programada', inicioSemana)
        .lte('fecha_programada', finSemana);

      // Calcular métricas
      const pedidosEntregados = pedidosSemana?.filter(p => p.estado === 'entregado').length || 0;
      const pedidosATiempo = pedidosSemana?.filter(p => {
        if (p.estado !== 'entregado') return false;
        return new Date(p.fecha_creacion) <= new Date(p.fecha_limite_entrega);
      }).length || 0;

      const porcentajePuntualidad = pedidosEntregados > 0 ? (pedidosATiempo / pedidosEntregados * 100) : 100;

      // Calcular km promedio por pedido
      const distanciaTotal = rutasSemana?.reduce((sum, r) => sum + (r.distancia_total_km || 0), 0) || 0;
      const kmPromedioPorPedido = pedidosEntregados > 0 ? distanciaTotal / pedidosEntregados : 0;

      // Calcular utilización promedio de camiones
      const { data: camiones } = await supabase
        .from('camiones')
        .select('capacidad_maxima_m3')
        .eq('bodega_id', bodega.id)
        .eq('activo', true);

      const capacidadTotal = camiones?.reduce((sum, c) => sum + c.capacidad_maxima_m3, 0) || 1;
      const volumenUtilizado = rutasSemana?.reduce((sum, r) => sum + (r.volumen_total_m3 || 0), 0) || 0;
      const utilizacionPromedio = (volumenUtilizado / capacidadTotal) * 100;

      // Calcular tiempo promedio de entrega
      const tiempoTotal = rutasSemana?.reduce((sum, r) => sum + (r.tiempo_estimado_horas || 0), 0) || 0;
      const tiempoPromedioEntrega = rutasSemana?.length ? tiempoTotal / rutasSemana.length : 0;

      // Generar alertas
      if (porcentajePuntualidad < 90) {
        const pedidosTarde = pedidosEntregados - pedidosATiempo;
        alertas.push(`Bodega ${bodega.nombre}: ${pedidosTarde} pedidos entregados tarde`);
      }

      if (utilizacionPromedio < 50) {
        const camionBajaUtilizacion = camiones?.filter((_, index) => {
          const rutasCamion = rutasSemana?.filter(r => r.camion_id === camiones[index]?.id) || [];
          const utilizacionCamion = rutasCamion.reduce((sum, r) => sum + (r.volumen_total_m3 || 0), 0);
          return utilizacionCamion < (camiones[index]?.capacidad_maxima_m3 * 0.5);
        });

        if (camionBajaUtilizacion && camionBajaUtilizacion.length > 0) {
          alertas.push(`Bodega ${bodega.nombre}: ${camionBajaUtilizacion.length} camiones con utilización baja`);
        }
      }

      reportePorBodega[bodega.nombre] = {
        pedidos_entregados: pedidosEntregados,
        pedidos_a_tiempo: pedidosATiempo,
        porcentaje_puntualidad: Math.round(porcentajePuntualidad * 10) / 10,
        km_promedio_por_pedido: Math.round(kmPromedioPorPedido * 10) / 10,
        utilizacion_promedio_camiones: Math.round(utilizacionPromedio * 10) / 10,
        tiempo_promedio_entrega: Math.round(tiempoPromedioEntrega * 10) / 10,
        rutas_completadas: rutasSemana?.filter(r => r.estado === 'completada').length || 0,
        distancia_total_km: Math.round(distanciaTotal * 10) / 10
      };
    }

    // Calcular métricas globales
    const totalPedidosEntregados = Object.values(reportePorBodega).reduce(
      (sum: number, bodega: any) => sum + bodega.pedidos_entregados, 0
    );
    
    const promedioGlobalPuntualidad = Object.values(reportePorBodega).reduce(
      (sum: number, bodega: any) => sum + bodega.porcentaje_puntualidad, 0
    ) / bodegas.length;

    const reporteFinal = {
      semana,
      periodo: `${inicioSemana} a ${finSemana}`,
      resumen_global: {
        total_pedidos_entregados: totalPedidosEntregados,
        promedio_puntualidad: Math.round(promedioGlobalPuntualidad * 10) / 10,
        bodegas_analizadas: bodegas.length
      },
      por_bodega: reportePorBodega,
      alertas,
      generado_en: new Date().toISOString()
    };

    console.log('Reporte de eficiencia generado:', reporteFinal);

    return new Response(JSON.stringify(reporteFinal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en efficiency-analytics:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      generado_en: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});