import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const MAPA_CIUDADES = {
  // Antioquia
  'Medellín': 'Antioquia', 'Envigado': 'Antioquia', 'Bello': 'Antioquia',
  'Itagüí': 'Antioquia', 'Rionegro': 'Antioquia', 'Apartadó': 'Antioquia',
  'Sabaneta': 'Antioquia', 'La Estrella': 'Antioquia',
  
  // Huila
  'Neiva': 'Huila', 'Pitalito': 'Huila', 'Garzón': 'Huila',
  'La Plata': 'Huila', 'Campoalegre': 'Huila', 'San Agustín': 'Huila',
  
  // Bolívar
  'Cartagena': 'Bolívar', 'Barranquilla': 'Bolívar', 'Soledad': 'Bolívar',
  'Malambo': 'Bolívar', 'Turbaco': 'Bolívar'
};

const DIAS_LIMITE_BODEGA = {
  'Antioquia': 1,  // 1 día hábil
  'Huila': 4,      // 4 días hábiles  
  'Bolívar': 4     // 4 días hábiles
};

function calcularFechaLimite(diasHabiles: number): string {
  const fecha = new Date();
  let diasSumados = 0;
  
  while (diasSumados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    // Excluir sábados (6) y domingos (0)
    if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
      diasSumados++;
    }
  }
  
  return fecha.toISOString().split('T')[0];
}

function detectarCiudad(direccion: string, ciudadEntrega?: string): string {
  if (ciudadEntrega && MAPA_CIUDADES[ciudadEntrega]) {
    return ciudadEntrega;
  }
  
  // Buscar ciudad en la dirección
  for (const ciudad of Object.keys(MAPA_CIUDADES)) {
    if (direccion.toLowerCase().includes(ciudad.toLowerCase())) {
      return ciudad;
    }
  }
  
  // Default a Medellín si no se encuentra
  return 'Medellín';
}

async function calcularVolumenTotal(items: any[]): Promise<number> {
  let volumenTotal = 0;
  
  for (const item of items) {
    const { data: producto } = await supabase
      .from('productos_volumen')
      .select('volumen_unitario_m3')
      .eq('nombre_producto', item.nombre)
      .eq('activo', true)
      .single();
    
    if (producto) {
      volumenTotal += producto.volumen_unitario_m3 * item.cantidad;
    } else {
      // Volumen estimado por defecto si no se encuentra el producto
      volumenTotal += 0.5 * item.cantidad;
    }
  }
  
  return volumenTotal;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pedido } = await req.json();
    
    console.log('Procesando asignación automática para pedido:', pedido.id || 'nuevo');

    // 1. Detectar ciudad y asignar bodega
    const ciudad = detectarCiudad(pedido.direccion_entrega, pedido.ciudad_entrega);
    const bodegaAsignada = MAPA_CIUDADES[ciudad] || 'Antioquia';
    
    // 2. Calcular volumen total basado en productos
    const volumenTotal = await calcularVolumenTotal(pedido.items || []);
    
    // 3. Determinar fecha límite según días hábiles de bodega
    const diasLimite = DIAS_LIMITE_BODEGA[bodegaAsignada] || 4;
    const fechaLimite = calcularFechaLimite(diasLimite);
    
    // 4. Asignar prioridad automática (90% normal, 10% urgente)
    const prioridad = Math.random() < 0.1 ? 3 : 1;
    
    // 5. Validar si hay capacidad disponible en bodega
    const { data: bodegaInfo } = await supabase
      .from('bodegas')
      .select('*')
      .eq('nombre', bodegaAsignada)
      .single();

    const { data: pedidosPendientes } = await supabase
      .from('pedidos')
      .select('volumen_total_m3')
      .eq('bodega_asignada', bodegaAsignada)
      .eq('estado', 'pendiente');

    const volumenPendiente = pedidosPendientes?.reduce((sum, p) => sum + (p.volumen_total_m3 || 0), 0) || 0;
    const capacidadDisponible = (bodegaInfo?.capacidad_total_m3 || 1000) - volumenPendiente;

    // Actualizar el pedido con la información calculada
    const updateData = {
      bodega_asignada: bodegaAsignada,
      ciudad_entrega: ciudad,
      volumen_total_m3: volumenTotal,
      fecha_limite_entrega: fechaLimite,
      prioridad: prioridad
    };

    const { data: updatedPedido, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', pedido.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const resultado = {
      pedido_actualizado: updatedPedido,
      asignaciones: {
        bodega_asignada: bodegaAsignada,
        ciudad_detectada: ciudad,
        volumen_calculado: volumenTotal,
        fecha_limite: fechaLimite,
        prioridad_asignada: prioridad,
        capacidad_disponible: capacidadDisponible,
        capacidad_suficiente: capacidadDisponible >= volumenTotal
      }
    };

    console.log('Asignación completada:', resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en auto-assign-logistics:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});