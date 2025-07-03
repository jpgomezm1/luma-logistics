import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bodega, fecha_planificacion, camiones_disponibles, pedidos_incluir } = await req.json();
    
    console.log(`Optimizando rutas para bodega: ${bodega}, fecha: ${fecha_planificacion}`);

    // Obtener información de la bodega
    const { data: bodegaInfo } = await supabase
      .from('bodegas')
      .select('*')
      .eq('nombre', bodega)
      .single();

    if (!bodegaInfo) {
      throw new Error(`Bodega ${bodega} no encontrada`);
    }

    // Obtener pedidos pendientes
    let pedidosQuery = supabase
      .from('pedidos')
      .select('*')
      .eq('bodega_asignada', bodega)
      .eq('estado', 'pendiente');

    if (pedidos_incluir && pedidos_incluir.length > 0) {
      pedidosQuery = pedidosQuery.in('id', pedidos_incluir);
    }

    const { data: pedidos } = await pedidosQuery;

    // Obtener camiones disponibles
    const { data: camiones } = await supabase
      .from('camiones')
      .select('*')
      .eq('bodega_id', bodegaInfo.id)
      .in('codigo', camiones_disponibles)
      .eq('activo', true);

    if (!pedidos || !camiones || camiones.length === 0) {
      return new Response(JSON.stringify({
        rutas_optimizadas: [],
        pedidos_no_asignados: pedidos?.map(p => p.id) || [],
        razon: "No hay camiones disponibles o pedidos pendientes"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar prompt para Gemini
    const prompt = `OPTIMIZA rutas de entrega para ${bodega}:

RESTRICCIONES:
- Horario operativo: 8:00 AM - 6:00 PM
- Tiempo descarga por pedido: 15-30 min según tamaño
- Base de operaciones: ${bodegaInfo.direccion_base}

PEDIDOS PENDIENTES:
${pedidos.map(p => `ID: ${p.id}, Cliente: ${p.nombre_cliente}, Dirección: ${p.direccion_entrega}, Ciudad: ${p.ciudad_entrega}, Volumen: ${p.volumen_total_m3}m³, Prioridad: ${p.prioridad}, Fecha límite: ${p.fecha_limite_entrega}`).join('\n')}

CAMIONES DISPONIBLES:
${camiones.map(c => `Código: ${c.codigo}, Capacidad: ${c.capacidad_maxima_m3}m³`).join('\n')}

OBJETIVOS (en orden de prioridad):
1. Entregar todos los pedidos críticos (prioridad 3)
2. No exceder fechas límite de entrega
3. Maximizar utilización de capacidad (80-95% óptimo)
4. Minimizar distancia total recorrida
5. Balancear carga entre camiones

RESPONDE SOLO EN JSON con esta estructura exacta:
{
  "rutas_optimizadas": [
    {
      "camion_codigo": "string",
      "pedidos": [
        {"id": number, "orden": number, "hora_estimada": "HH:MM"}
      ],
      "resumen": {
        "total_pedidos": number,
        "volumen_utilizado": number,
        "porcentaje_capacidad": number,
        "distancia_km": number,
        "tiempo_horas": number
      }
    }
  ],
  "pedidos_no_asignados": [number],
  "razon": "string"
}`;

    // Llamar a Gemini AI
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      }),
    });

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0]) {
      throw new Error('Error al generar respuesta de Gemini');
    }

    const responseText = geminiData.candidates[0].content.parts[0].text;
    console.log('Respuesta de Gemini:', responseText);

    // Parsear respuesta JSON de Gemini
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;
    const jsonResponse = responseText.substring(jsonStart, jsonEnd);
    
    const optimizationResult = JSON.parse(jsonResponse);

    return new Response(JSON.stringify(optimizationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en optimize-routes:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      rutas_optimizadas: [],
      pedidos_no_asignados: [],
      razon: "Error en la optimización"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});