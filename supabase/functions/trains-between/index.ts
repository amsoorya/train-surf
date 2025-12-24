import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Primary API: irctc-api2
const PRIMARY_API = {
  host: "irctc-api2.p.rapidapi.com",
  endpoint: (from: string, to: string, date: string) => `/trainAvailability?source=${from}&destination=${to}&date=${date}`
};

// Fallback API: irctc1
const FALLBACK_API = {
  host: "irctc1.p.rapidapi.com",
  endpoint: (from: string, to: string) => `/api/v3/trainBetweenStations?fromStationCode=${from}&toStationCode=${to}`
};

function isValidResponse(data: any): boolean {
  // Check various error indicators
  if (!data) return false;
  if (data.error) return false;
  if (data.status === false) return false;
  if (data.message && data.message.toLowerCase().includes('error')) return false;
  if (data.message && data.message.toLowerCase().includes('invalid')) return false;
  // If we have actual train data, consider it valid
  if (data.data && Array.isArray(data.data)) return true;
  if (data.trains && Array.isArray(data.trains)) return true;
  if (Array.isArray(data)) return true;
  return true;
}

async function fetchWithFallback(fromStation: string, toStation: string, date: string, apiKey: string) {
  // Convert date format from YYYY-MM-DD to DD-MM-YYYY for primary API
  const dateParts = date.split('-');
  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

  // Try primary API first
  console.log(`Trying primary API: ${PRIMARY_API.host}`);
  try {
    const url = `https://${PRIMARY_API.host}${PRIMARY_API.endpoint(fromStation, toStation, formattedDate)}`;
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
      console.log("Primary API response:", JSON.stringify(data).substring(0, 300));
      if (isValidResponse(data)) {
        console.log("Primary API succeeded with valid data");
        return { data, source: 'primary' };
      }
    }
    console.log(`Primary API failed or returned invalid data`);
  } catch (error) {
    console.log(`Primary API error: ${error}`);
  }

  // Try fallback API
  console.log(`Trying fallback API: ${FALLBACK_API.host}`);
  try {
    const url = `https://${FALLBACK_API.host}${FALLBACK_API.endpoint(fromStation, toStation)}`;
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
      console.log("Fallback API response:", JSON.stringify(data).substring(0, 300));
      if (isValidResponse(data)) {
        console.log("Fallback API succeeded with valid data");
        return { data, source: 'fallback' };
      }
    }
    console.log(`Fallback API failed or returned invalid data, status: ${response.status}`);
  } catch (error) {
    console.log(`Fallback API error: ${error}`);
  }

  throw new Error("All API endpoints failed or returned invalid data");
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
    console.log(`Trains between response from ${source}`);

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
