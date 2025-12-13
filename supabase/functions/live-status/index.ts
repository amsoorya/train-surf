import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LiveStatusRequest {
  trainNo: string;
  startDay: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RAPIDAPI_KEY");
    if (!apiKey) {
      console.error("RAPIDAPI_KEY not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body: LiveStatusRequest = await req.json();
    const { trainNo, startDay = 0 } = body;

    if (!trainNo) {
      return new Response(JSON.stringify({ error: "Train number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Fetching live status for train ${trainNo}, startDay: ${startDay}`);

    const url = `https://irctc-train-api.p.rapidapi.com/api/v1/live-train-status?trainNo=${trainNo}&startDay=${startDay}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "irctc-train-api.p.rapidapi.com",
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    console.log("Live status response:", JSON.stringify(data).substring(0, 500));

    if (!data || data.error) {
      return new Response(JSON.stringify({ 
        error: data?.message || data?.error || "Failed to fetch live status" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse and format the response
    const result = {
      trainNo: data.trainNo || trainNo,
      trainName: data.trainName || "Unknown Train",
      runningStatus: data.trainStatusMessage || data.currentStatusMessage || "Status unavailable",
      currentStation: data.currentStationName || data.currentStation || "Unknown",
      lastUpdated: data.lastUpdatedTime || new Date().toLocaleTimeString(),
      route: (data.route || []).map((station: any) => ({
        stationCode: station.stationCode || "",
        stationName: station.stationName || "",
        scheduledArrival: station.scheduledArrival || "",
        actualArrival: station.actualArrival || "",
        scheduledDeparture: station.scheduledDeparture || "",
        actualDeparture: station.actualDeparture || "",
        delayInMins: station.delayInMins || station.delayArrival || 0,
        status: station.hasDeparted ? "departed" : station.hasArrived ? "arrived" : "upcoming",
        platform: station.platform || null
      }))
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Live status error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
