import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LiveStatusRequest {
  trainNo: string;
  startDay: number;
}

// Rate limiting - per user with in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(userId);
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 15) { // Max 15 requests per minute per user
    return false;
  }
  
  limit.count++;
  return true;
}

// Validate user from JWT token
async function validateUser(authHeader: string): Promise<{ userId: string } | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error("Invalid token:", error?.message);
      return null;
    }

    return { userId: user.id };
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate user from JWT
    const userValidation = await validateUser(authHeader);
    if (!userValidation) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { userId } = userValidation;
    console.log(`Authenticated user: ${userId}`);

    // Check rate limit using authenticated user ID
    if (!checkRateLimit(userId)) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

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

    // Input validation
    if (!trainNo) {
      return new Response(JSON.stringify({ error: "Train number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate train number format (4-5 digits)
    if (!/^\d{4,5}$/.test(trainNo)) {
      return new Response(JSON.stringify({ error: "Invalid train number format. Use 4-5 digits." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate startDay (must be 0, 1, 2, or 3)
    const validStartDays = [0, 1, 2, 3];
    if (!validStartDays.includes(Number(startDay))) {
      return new Response(JSON.stringify({ error: "Invalid startDay. Use 0, 1, 2, or 3." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Fetching live status for train ${trainNo}, startDay: ${startDay}, user: ${userId}`);

    const url = `https://irctc-train-api.p.rapidapi.com/api/v1/live-train-status?trainNo=${encodeURIComponent(trainNo)}&startDay=${encodeURIComponent(String(startDay))}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "irctc-train-api.p.rapidapi.com",
        "Accept": "application/json"
      }
    });

    const data = await response.json();
    console.log("Live status response received");

    if (!data || data.error) {
      return new Response(JSON.stringify({ 
        error: "Failed to fetch live status. Please try again." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse and format the response (sanitize output)
    const result = {
      trainNo: String(data.trainNo || trainNo).substring(0, 10),
      trainName: String(data.trainName || "Unknown Train").substring(0, 100),
      runningStatus: String(data.trainStatusMessage || data.currentStatusMessage || "Status unavailable").substring(0, 200),
      currentStation: String(data.currentStationName || data.currentStation || "Unknown").substring(0, 100),
      lastUpdated: String(data.lastUpdatedTime || new Date().toLocaleTimeString()).substring(0, 50),
      route: (Array.isArray(data.route) ? data.route.slice(0, 100) : []).map((station: any) => ({
        stationCode: String(station?.stationCode || "").substring(0, 10),
        stationName: String(station?.stationName || "").substring(0, 100),
        scheduledArrival: String(station?.scheduledArrival || "").substring(0, 20),
        actualArrival: String(station?.actualArrival || "").substring(0, 20),
        scheduledDeparture: String(station?.scheduledDeparture || "").substring(0, 20),
        actualDeparture: String(station?.actualDeparture || "").substring(0, 20),
        delayInMins: Math.min(Math.max(Number(station?.delayInMins || station?.delayArrival || 0), -9999), 9999),
        status: station?.hasDeparted ? "departed" : station?.hasArrived ? "arrived" : "upcoming",
        platform: station?.platform ? String(station.platform).substring(0, 10) : null
      }))
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Live status error:", error);
    return new Response(JSON.stringify({ 
      error: "An error occurred processing your request"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
