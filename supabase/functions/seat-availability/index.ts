import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { classType, fromStationCode, quota, toStationCode, trainNo } = await req.json();
    
    if (!classType || !fromStationCode || !quota || !toStationCode || !trainNo) {
      return new Response(
        JSON.stringify({ error: "classType, fromStationCode, quota, toStationCode, and trainNo required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      console.error("RAPIDAPI_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking seat availability: ${trainNo} from ${fromStationCode} to ${toStationCode}, class: ${classType}, quota: ${quota}`);

    const response = await fetch(`https://irctc1.p.rapidapi.com/api/v1/checkSeatAvailability?classType=${classType}&fromStationCode=${fromStationCode}&quota=${quota}&toStationCode=${toStationCode}&trainNo=${trainNo}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "irctc1.p.rapidapi.com"
      }
    });

    const data = await response.json();
    console.log("Seat availability response:", JSON.stringify(data).substring(0, 300));

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Seat availability error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
