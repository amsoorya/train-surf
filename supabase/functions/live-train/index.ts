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

    // Try with startDay=1 first (most common), then 0 and 2
    for (const startDay of [1, 0, 2]) {
      console.log(`Fetching live status for train: ${trainNo}, startDay: ${startDay}`);

      try {
        const response = await fetch(`https://irctc-api2.p.rapidapi.com/liveTrain?trainNumber=${trainNo}&startDay=${startDay}`, {
          method: "GET",
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "irctc-api2.p.rapidapi.com"
          }
        });

        const data = await response.json();
        console.log(`Live train response (startDay=${startDay}):`, JSON.stringify(data).substring(0, 300));

        // Check for quota exceeded or API error messages
        if (data?.message?.toLowerCase().includes('exceeded') || 
            data?.message?.toLowerCase().includes('quota') ||
            data?.message?.toLowerCase().includes('upgrade')) {
          console.log("API quota exceeded");
          return new Response(
            JSON.stringify({ error: "API quota exceeded. Please try again later or enable Tester Mode." }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if we got valid data (success: true with data)
        if (data && data.success === true && data.data) {
          return new Response(
            JSON.stringify(data),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // If success is false but has error about train not started, try next startDay
        if (data?.error?.toLowerCase().includes('not started') || 
            data?.error?.toLowerCase().includes('yet to start') ||
            data?.error?.toLowerCase().includes('not running')) {
          console.log(`Train not started for startDay=${startDay}, trying next...`);
          continue;
        }

        // If success is false with an error, return it
        if (data?.success === false && data?.error) {
          return new Response(
            JSON.stringify({ error: data.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Return data even if not ideal
        if (response.ok && data) {
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
