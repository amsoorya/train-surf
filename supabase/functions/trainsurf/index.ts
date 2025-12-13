import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrainSurfRequest {
  trainNo: string;
  source: string;
  destination: string;
  date: string;
  classType: string;
  quota: string;
  mode?: "normal" | "urgent";
}

interface Segment {
  from: string;
  to: string;
  status: string;
  isAvailable: boolean;
}

interface TrainSurfResult {
  success: boolean;
  segments: Segment[];
  seatChanges: number;
  apiCalls: number;
  totalStations: number;
  error?: string;
  debugInfo: string[];
}

// Rate limiting - simple in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = rateLimitStore.get(clientId);
  
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 10) { // Max 10 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

// Availability cache for memoization
const availabilityCache = new Map<string, { isAvailable: boolean; status: string }>();

async function httpGet(path: string, params: Record<string, string>, apiKey: string, host = "irctc1.p.rapidapi.com"): Promise<any> {
  const url = new URL(`https://${host}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": host,
        "Accept": "application/json",
        "User-Agent": "TrainSurf/3.0"
      }
    });

    const text = await response.text();
    if (!text) {
      return { error: "empty response", status_code: response.status };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { error: `JSON parse error`, raw_text: text.substring(0, 200), status_code: response.status };
    }
  } catch (error) {
    return { error: `Connection error: ${error}` };
  }
}

async function getTrainDetails(trainNo: string, apiKey: string): Promise<any> {
  return httpGet("/api/v1/train-details", { trainNo }, apiKey, "irctc-train-api.p.rapidapi.com");
}

async function getLiveTrainStatus(trainNo: string, apiKey: string, startDay = 0): Promise<any> {
  return httpGet("/api/v1/live-train-status", { trainNo, startDay: String(startDay) }, apiKey, "irctc-train-api.p.rapidapi.com");
}

async function checkSeatAvailabilityRaw(trainNo: string, fromCode: string, toCode: string, date: string, classType: string, quota: string, apiKey: string): Promise<any> {
  return httpGet("/api/v1/checkSeatAvailability", {
    trainNo,
    fromStationCode: fromCode,
    toStationCode: toCode,
    classType,
    quota,
    date
  }, apiKey);
}

function extractStationCodesFromTrainDetails(detailsJson: any): string[] {
  if (detailsJson.error) throw new Error(`API Error: ${detailsJson.error}`);
  if (!detailsJson.status) throw new Error("API returned status: false");

  const codes: string[] = [];
  if (typeof detailsJson.data === "object" && detailsJson.data) {
    const trainRoute = detailsJson.data.trainRoute;
    if (Array.isArray(trainRoute)) {
      for (const station of trainRoute) {
        if (typeof station === "object" && station) {
          const stationName = station.stationName || "";
          if (stationName.includes(" - ")) {
            const parts = stationName.split(" - ");
            if (parts.length >= 2) {
              codes.push(parts[parts.length - 1].trim().toUpperCase());
            }
          }
        }
      }
    }
  }

  if (codes.length > 0) return codes;
  throw new Error("Could not extract station codes");
}

function extractStationCodesFromLiveStatus(statusJson: any): string[] {
  if (statusJson.error) throw new Error(`API Error: ${statusJson.error}`);

  const codes: string[] = [];
  const route = statusJson.route;
  if (Array.isArray(route)) {
    for (const station of route) {
      if (typeof station === "object" && station) {
        const code = station.stationCode;
        if (code) codes.push(String(code).trim().toUpperCase());
      }
    }
  }

  if (codes.length > 0) return codes;
  throw new Error("Could not extract station codes");
}

function sliceRouteBetween(codes: string[], source: string, destination: string): string[] {
  const src = source.trim().toUpperCase();
  const dst = destination.trim().toUpperCase();
  const codesUpper = codes.map(c => c.trim().toUpperCase());

  const srcIdx = codesUpper.indexOf(src);
  if (srcIdx === -1) {
    throw new Error(`Source '${source}' not found in route. Available: ${codes.slice(0, 20).join(", ")}`);
  }

  const dstIdx = codesUpper.indexOf(dst);
  if (dstIdx === -1) {
    throw new Error(`Destination '${destination}' not found in route. Available: ${codes.slice(0, 20).join(", ")}`);
  }

  if (dstIdx < srcIdx) {
    throw new Error("Destination is before source in route");
  }

  return codes.slice(srcIdx, dstIdx + 1);
}

function isAvailableStatus(status: string): boolean {
  if (!status) return false;
  const s = status.trim().toUpperCase();

  if (s.includes("NOT AVAILABLE") || s.includes("NOT_AVAILABLE")) return false;

  if (s.includes("AVAILABLE") && !s.includes("NOT")) {
    if (s.includes("AVAILABLE-")) {
      try {
        const parts = s.split("AVAILABLE-");
        if (parts.length > 1) {
          const num = parseInt(parts[1].split(/\s/)[0]);
          return num > 0;
        }
      } catch { /* ignore */ }
    }
    return true;
  }

  if (s.includes("CNF") || s.includes("CONFIRM")) return true;
  if (s.includes("RAC")) return true;
  if (["WL", "GNWL", "RLWL", "PQWL", "TQWL", "CKWL"].some(wl => s.includes(wl))) return false;

  return false;
}

function parseAvailabilityForDate(resp: any, targetDate: string): { isAvailable: boolean; status: string } {
  if (typeof resp !== "object" || !resp) return { isAvailable: false, status: "INVALID_RESPONSE" };
  if (resp.error) {
    const errorMsg = String(resp.error || "unknown");
    if (errorMsg.toLowerCase().includes("rate") || errorMsg.toLowerCase().includes("limit")) {
      return { isAvailable: false, status: "RATE_LIMIT_ERROR" };
    }
    return { isAvailable: false, status: `API_ERROR: ${errorMsg.substring(0, 50)}` };
  }

  if (resp.status === false) {
    const message = resp.message || "";
    return { isAvailable: false, status: message ? `API_FALSE: ${message.substring(0, 50)}` : "API_STATUS_FALSE" };
  }

  const data = resp.data;
  if (Array.isArray(data) && data.length > 0) {
    for (const row of data) {
      if (typeof row === "object" && row) {
        const rowDate = row.date || "";
        if (rowDate === targetDate) {
          const status = row.current_status || row.currentStatus || row.status;
          if (status) {
            const statusStr = String(status).trim();
            return { isAvailable: isAvailableStatus(statusStr), status: statusStr };
          }
        }
      }
    }

    const first = data[0];
    if (typeof first === "object" && first) {
      const status = first.current_status || first.currentStatus || first.status;
      if (status) {
        const statusStr = String(status).trim();
        return { isAvailable: isAvailableStatus(statusStr), status: statusStr };
      }
    }
  }

  if (typeof data === "object" && data) {
    const avail = data.availability;
    if (Array.isArray(avail) && avail.length > 0) {
      for (const row of avail) {
        if (typeof row === "object" && row) {
          const rowDate = row.date || "";
          if (rowDate === targetDate) {
            const status = row.status || row.currentStatus;
            if (status) {
              const statusStr = String(status).trim();
              return { isAvailable: isAvailableStatus(statusStr), status: statusStr };
            }
          }
        }
      }

      const first = avail[0];
      if (typeof first === "object" && first) {
        const status = first.status || first.currentStatus;
        if (status) {
          const statusStr = String(status).trim();
          return { isAvailable: isAvailableStatus(statusStr), status: statusStr };
        }
      }
    }
  }

  return { isAvailable: false, status: "NO_DATA_IN_RESPONSE" };
}

async function checkSegment(
  trainNo: string,
  fromIdx: number,
  toIdx: number,
  route: string[],
  date: string,
  classType: string,
  quota: string,
  apiKey: string,
  apiCalls: { count: number }
): Promise<{ isAvailable: boolean; status: string }> {
  const fromCode = route[fromIdx];
  const toCode = route[toIdx];
  const cacheKey = `${trainNo}|${fromCode}|${toCode}|${date}|${classType}|${quota}`;

  if (availabilityCache.has(cacheKey)) {
    return availabilityCache.get(cacheKey)!;
  }

  if (toIdx - fromIdx < 2) {
    const result = { isAvailable: false, status: "SKIP_TOO_CLOSE" };
    availabilityCache.set(cacheKey, result);
    return result;
  }

  const resp = await checkSeatAvailabilityRaw(trainNo, fromCode, toCode, date, classType, quota, apiKey);
  apiCalls.count++;

  await new Promise(resolve => setTimeout(resolve, 150));

  const result = parseAvailabilityForDate(resp, date);
  availabilityCache.set(cacheKey, result);

  return result;
}

async function findLongestHopBackward(
  trainNo: string,
  sourceIdx: number,
  destIdx: number,
  route: string[],
  date: string,
  classType: string,
  quota: string,
  apiKey: string,
  apiCalls: { count: number },
  debugInfo: string[]
): Promise<{ startIdx: number; status: string } | null> {
  debugInfo.push(`Searching backward from ${route[destIdx]} (idx ${destIdx})`);

  let consecutiveApiErrors = 0;
  const maxApiErrors = 3;

  let left = sourceIdx;
  let right = destIdx - 1;
  let bestStart: number | null = null;
  let bestStatus: string | null = null;

  while (left <= right) {
    if (apiCalls.count >= 18) {
      debugInfo.push(`Approaching API limit (${apiCalls.count} calls), stopping search`);
      break;
    }

    const mid = Math.floor((left + right) / 2);
    debugInfo.push(`Binary search: left=${left}, mid=${mid}, right=${right}`);

    const { isAvailable, status } = await checkSegment(trainNo, mid, destIdx, route, date, classType, quota, apiKey, apiCalls);

    if (status.includes("API_ERROR") || status.includes("RATE_LIMIT") || status.includes("API_FALSE")) {
      consecutiveApiErrors++;
      debugInfo.push(`API Error at [${mid}→${destIdx}]: ${status}`);

      if (consecutiveApiErrors >= maxApiErrors) {
        debugInfo.push(`Too many consecutive API errors (${consecutiveApiErrors}), stopping search`);
        return null;
      }

      left = mid + 1;
      await new Promise(resolve => setTimeout(resolve, 300));
      continue;
    }

    consecutiveApiErrors = 0;
    const icon = isAvailable ? "✅" : "❌";
    debugInfo.push(`${icon} Checked [${mid}→${destIdx}] ${route[mid]} → ${route[destIdx]}: ${status}`);

    if (isAvailable) {
      bestStart = mid;
      bestStatus = status;
      right = mid - 1;
      debugInfo.push(`Moving search left (found available at ${mid})`);
    } else {
      left = mid + 1;
      debugInfo.push(`Moving search right (not available at ${mid})`);
    }
  }

  if (bestStart !== null && bestStatus !== null) {
    debugInfo.push(`Longest hop found: [${bestStart}→${destIdx}] ${route[bestStart]} → ${route[destIdx]}`);
    return { startIdx: bestStart, status: bestStatus };
  }

  debugInfo.push(`No available hop ending at ${route[destIdx]}`);
  return null;
}

async function smartSeatStitching(
  route: string[],
  trainNo: string,
  date: string,
  classType: string,
  quota: string,
  apiKey: string
): Promise<TrainSurfResult> {
  const n = route.length;
  const sourceIdx = 0;
  const destIdx = n - 1;

  const segments: Segment[] = [];
  const apiCalls = { count: 0 };
  let currentDest = destIdx;
  let currentSource = sourceIdx;
  const debugInfo: string[] = [];

  debugInfo.push(`Starting Smart Seat-Stitching Algorithm`);
  debugInfo.push(`Route: ${route[0]} → ${route[route.length - 1]} (${n} stations)`);

  let iteration = 0;

  while (currentSource < currentDest) {
    iteration++;
    debugInfo.push(`Iteration ${iteration}: [${currentSource}→${currentDest}] (${route[currentSource]} → ${route[currentDest]})`);

    // Check direct path first
    if (iteration === 1) {
      debugInfo.push(`Checking direct path: ${route[currentSource]} → ${route[currentDest]}`);
      const { isAvailable, status } = await checkSegment(trainNo, currentSource, currentDest, route, date, classType, quota, apiKey, apiCalls);

      if (isAvailable) {
        debugInfo.push(`Direct path available!`);
        segments.unshift({
          from: route[currentSource],
          to: route[currentDest],
          status,
          isAvailable: true
        });
        break;
      } else {
        debugInfo.push(`Direct not available: ${status}`);
      }
    }

    const result = await findLongestHopBackward(trainNo, currentSource, currentDest, route, date, classType, quota, apiKey, apiCalls, debugInfo);

    if (result === null) {
      debugInfo.push(`Cannot find available segment ending at ${route[currentDest]}`);
      return {
        success: false,
        segments: [],
        seatChanges: 0,
        apiCalls: apiCalls.count,
        totalStations: n,
        error: `No available segment found ending at ${route[currentDest]}`,
        debugInfo
      };
    }

    segments.unshift({
      from: route[result.startIdx],
      to: route[currentDest],
      status: result.status,
      isAvailable: true
    });

    debugInfo.push(`Locked segment: ${route[result.startIdx]} → ${route[currentDest]}`);
    currentDest = result.startIdx;
    debugInfo.push(`New destination: ${route[currentDest]} (idx ${currentDest})`);

    if (apiCalls.count >= 20) {
      debugInfo.push(`Reached 20 API calls limit`);
      if (currentSource < currentDest) {
        return {
          success: false,
          segments: [],
          seatChanges: 0,
          apiCalls: apiCalls.count,
          totalStations: n,
          error: "Could not complete journey within API limit",
          debugInfo
        };
      }
      break;
    }
  }

  debugInfo.push(`Journey successfully stitched! Total API calls: ${apiCalls.count}`);

  return {
    success: true,
    segments,
    seatChanges: segments.length - 1,
    apiCalls: apiCalls.count,
    totalStations: n,
    debugInfo
  };
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

    // Extract client identifier for rate limiting
    const clientId = authHeader.split(" ")[1]?.substring(0, 20) || "anonymous";
    
    // Check rate limit
    if (!checkRateLimit(clientId)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
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

    const body: TrainSurfRequest = await req.json();
    console.log("TrainSurf request:", { ...body, mode: body.mode || "urgent" });

    const { trainNo, source, destination, date, classType, quota, mode = "urgent" } = body;

    // Input validation
    if (!trainNo || !source || !destination || !date || !classType || !quota) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate input format
    if (!/^\d{4,5}$/.test(trainNo)) {
      return new Response(JSON.stringify({ error: "Invalid train number format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!/^[A-Z]{2,5}$/.test(source.toUpperCase()) || !/^[A-Z]{2,5}$/.test(destination.toUpperCase())) {
      return new Response(JSON.stringify({ error: "Invalid station code format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Clear cache for fresh results
    availabilityCache.clear();

    // Normal mode - only check direct availability
    if (mode === "normal") {
      console.log("Running in normal mode - checking direct availability only");
      
      const resp = await checkSeatAvailabilityRaw(trainNo, source.toUpperCase(), destination.toUpperCase(), date, classType, quota, apiKey);
      const { isAvailable, status } = parseAvailabilityForDate(resp, date);

      return new Response(JSON.stringify({
        success: isAvailable,
        segments: [{
          from: source.toUpperCase(),
          to: destination.toUpperCase(),
          status,
          isAvailable
        }],
        seatChanges: 0,
        apiCalls: 1,
        totalStations: 2,
        debugInfo: ["Normal mode: checked direct availability only"]
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Urgent mode - full seat-stitching algorithm
    console.log("Fetching train details...");
    let stationCodes: string[];

    try {
      const detailsResp = await getTrainDetails(trainNo, apiKey);
      stationCodes = extractStationCodesFromTrainDetails(detailsResp);
    } catch (e1) {
      console.log("Train details failed, trying live status...");
      try {
        const statusResp = await getLiveTrainStatus(trainNo, apiKey);
        stationCodes = extractStationCodesFromLiveStatus(statusResp);
      } catch (e2) {
        console.error("Both route fetch methods failed:", e1, e2);
        return new Response(JSON.stringify({ 
          error: "Could not fetch train route. Please check the train number.",
          debugInfo: [`Error 1: ${e1}`, `Error 2: ${e2}`]
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    console.log(`Found ${stationCodes.length} stations in route`);

    // Step 2: Slice route between source and destination
    let route: string[];
    try {
      route = sliceRouteBetween(stationCodes, source, destination);
    } catch (routeError) {
      console.error("Route slicing error:", routeError);
      return new Response(JSON.stringify({ 
        error: routeError instanceof Error ? routeError.message : "Invalid route",
        debugInfo: [`Full route: ${stationCodes.join(", ")}`]
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Route segment: ${route.join(" → ")}`);

    // Step 3: Run the smart seat stitching algorithm
    const result = await smartSeatStitching(route, trainNo, date, classType, quota, apiKey);

    console.log(`Result: success=${result.success}, segments=${result.segments.length}, apiCalls=${result.apiCalls}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("TrainSurf error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
