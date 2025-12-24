import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Primary API: irctc-api2 (train availability)
const PRIMARY_API = {
  host: "irctc-api2.p.rapidapi.com",
  endpoint: (from: string, to: string, date: string) => `/trainAvailability?source=${from}&destination=${to}&date=${date}`
};

// Fallback API: irctc1 (trains between stations)
const FALLBACK_API = {
  host: "irctc1.p.rapidapi.com",
  endpoint: (from: string, to: string) => `/api/v3/trainBetweenStations?fromStationCode=${from}&toStationCode=${to}`
};

async function fetchWithFallback(fromStation: string, toStation: string, date: string, apiKey: string) {
  // Convert date format from YYYY-MM-DD to DD-MM-YYYY for primary API
  const dateParts = date.split('-');
  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

  // Try primary API first
  console.log(`Trying primary API: ${PRIMARY_API.host}`);
  try {
    const response = await fetch(`https://${PRIMARY_API.host}${PRIMARY_API.endpoint(fromStation, toStation, formattedDate)}`, {
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
    const response = await fetch(`https://${FALLBACK_API.host}${FALLBACK_API.endpoint(fromStation, toStation)}`, {
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
    const { fromStation, toStation, date } = await req.json();
    
    if (!fromStation || !toStation || !date) {
      return new Response(
        JSON.stringify({ error: "fromStation, toStation, and date required" }),
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

    console.log(`Fetching trains between ${fromStation} and ${toStation} on ${date}`);

    const { data, source } = await fetchWithFallback(fromStation, toStation, date, apiKey);
    console.log(`Trains between response from ${source}:`, JSON.stringify(data).substring(0, 200));

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Trains between error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
