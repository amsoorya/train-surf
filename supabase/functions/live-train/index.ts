import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Primary API: irctc-api2
const PRIMARY_API = {
  host: "irctc-api2.p.rapidapi.com",
  endpoint: (trainNo: string, startDay: number) => `/liveTrain?trainNumber=${trainNo}&startDay=${startDay}`
};

// Fallback API: irctc1
const FALLBACK_API = {
  host: "irctc1.p.rapidapi.com",
  endpoint: (trainNo: string, startDay: number) => `/api/v1/liveTrainStatus?trainNo=${trainNo}&startDay=${startDay}`
};

async function fetchWithFallback(trainNo: string, startDay: number, apiKey: string) {
  // Try primary API first
  console.log(`Trying primary API: ${PRIMARY_API.host}`);
  try {
    const response = await fetch(`https://${PRIMARY_API.host}${PRIMARY_API.endpoint(trainNo, startDay)}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": PRIMARY_API.host
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && !data.error) {
        console.log("Primary API succeeded");
        return { data, source: 'primary' };
      }
    }
    console.log(`Primary API failed with status: ${response.status}`);
  } catch (error) {
    console.log(`Primary API error: ${error}`);
  }

  // Try fallback API
  console.log(`Trying fallback API: ${FALLBACK_API.host}`);
  try {
    const response = await fetch(`https://${FALLBACK_API.host}${FALLBACK_API.endpoint(trainNo, startDay)}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": FALLBACK_API.host
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Fallback API succeeded");
      return { data, source: 'fallback' };
    }
    console.log(`Fallback API failed with status: ${response.status}`);
  } catch (error) {
    console.log(`Fallback API error: ${error}`);
  }

  throw new Error("All API endpoints failed");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trainNo, startDay = 1 } = await req.json();
    
    if (!trainNo) {
      return new Response(
        JSON.stringify({ error: "trainNo required" }),
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

    console.log(`Fetching live status for train: ${trainNo}, startDay: ${startDay}`);

    const { data, source } = await fetchWithFallback(trainNo, startDay, apiKey);
    console.log(`Live train response from ${source}:`, JSON.stringify(data).substring(0, 200));

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Live train error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
