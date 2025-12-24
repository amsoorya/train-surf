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
    const { trainNo } = await req.json();
    
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

    // Try with startDay=0 (started today) first, then startDay=1 (started yesterday)
    for (const startDay of [0, 1, 2]) {
      console.log(`Fetching live status for train: ${trainNo}, startDay: ${startDay}`);

      try {
        const response = await fetch(`https://irctc-train-api.p.rapidapi.com/api/v1/live-train-status?trainNo=${trainNo}&startDay=${startDay}`, {
          method: "GET",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "irctc-train-api.p.rapidapi.com"
          }
        });

        const data = await response.json();
        console.log(`Live train response (startDay=${startDay}):`, JSON.stringify(data).substring(0, 300));

        // Check if we got valid data
        if (data && data.status === true && data.data) {
          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // If status is false but has a message about train not started, try next startDay
        if (data?.message?.toLowerCase().includes('not started') || 
            data?.message?.toLowerCase().includes('yet to start')) {
          console.log(`Train not started for startDay=${startDay}, trying next...`);
          continue;
        }

        // Return data even if not ideal
        if (response.ok) {
          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (err) {
        console.log(`Error with startDay=${startDay}:`, err);
      }
    }

    // If all attempts failed
    return new Response(
      JSON.stringify({ error: "Could not fetch train status. Train may not be running." }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
