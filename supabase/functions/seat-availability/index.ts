import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Primary API: irctc-api2
const PRIMARY_API = {
  host: "irctc-api2.p.rapidapi.com",
  endpoint: (source: string, destination: string, date: string, classType: string, quota: string) => 
    `/trainAvailability?source=${source}&destination=${destination}&date=${date}&classType=${classType}&quota=${quota}`
};

// Fallback API: irctc1
const FALLBACK_API = {
  host: "irctc1.p.rapidapi.com",
  endpoint: (source: string, destination: string, classType: string, quota: string, trainNo: string) => 
    `/api/v2/checkSeatAvailability?classType=${classType}&fromStationCode=${source}&quota=${quota}&toStationCode=${destination}&trainNo=${trainNo}`
};

async function fetchWithFallback(
  source: string, 
  destination: string, 
  date: string, 
  classType: string, 
  quota: string,
  trainNo: string,
  apiKey: string
) {
  // Convert date format from YYYY-MM-DD to DD-MM-YYYY for primary API
  const dateParts = date.split('-');
  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

  // Try primary API first
  console.log(`Trying primary API: ${PRIMARY_API.host}`);
  try {
    const url = `https://${PRIMARY_API.host}${PRIMARY_API.endpoint(source, destination, formattedDate, classType, quota)}`;
    console.log(`Primary URL: ${url}`);
    
    const response = await fetch(url, {
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

  // Try fallback API (requires trainNo)
  if (trainNo) {
    console.log(`Trying fallback API: ${FALLBACK_API.host}`);
    try {
      const url = `https://${FALLBACK_API.host}${FALLBACK_API.endpoint(source, destination, classType, quota, trainNo)}`;
      console.log(`Fallback URL: ${url}`);
      
      const response = await fetch(url, {
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
  }

  throw new Error("All API endpoints failed");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, destination, date, classType, quota, trainNo } = await req.json();
    
    if (!source || !destination || !date || !classType || !quota) {
      return new Response(
        JSON.stringify({ error: "source, destination, date, classType, and quota required" }),
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

    console.log(`Checking seat availability: ${source} to ${destination} on ${date}, class: ${classType}, quota: ${quota}`);

    const { data, source: apiSource } = await fetchWithFallback(source, destination, date, classType, quota, trainNo || '', apiKey);
    console.log(`Seat availability response from ${apiSource}:`, JSON.stringify(data).substring(0, 200));

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
