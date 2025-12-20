import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Using LibreTranslate API (open source, free)
const LIBRE_TRANSLATE_URL = "https://libretranslate.com/translate";

// Language code mapping to LibreTranslate supported codes
const LANG_MAP: Record<string, string> = {
  en: "en", hi: "hi", bn: "bn", ta: "ta", te: "te", mr: "mr", gu: "gu", 
  kn: "kn", ml: "ml", pa: "pa", ur: "ur", or: "en", // Odia fallback to English
  as: "en", // Assamese fallback
  ne: "en", // Nepali fallback  
  sa: "en", // Sanskrit fallback
  ks: "ur", // Kashmiri -> Urdu
  sd: "ur", // Sindhi -> Urdu
  kok: "mr", // Konkani -> Marathi
  mai: "hi", // Maithili -> Hindi
  doi: "hi", // Dogri -> Hindi
  mni: "en", // Manipuri fallback
  sat: "en", // Santali fallback
  bo: "zh", // Bodo/Tibetan -> Chinese
  es: "es", fr: "fr", pt: "pt", de: "de", ar: "ar", ru: "ru", 
  zh: "zh", ja: "ja", ko: "ko",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLang } = await req.json();
    
    if (!texts || !Array.isArray(texts) || !targetLang) {
      return new Response(
        JSON.stringify({ error: "texts (array) and targetLang required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If target is English, return original texts
    if (targetLang === 'en') {
      return new Response(
        JSON.stringify({ translations: texts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mappedLang = LANG_MAP[targetLang] || 'en';
    console.log(`Translating ${texts.length} texts to ${mappedLang}`);

    // Use Google Translate free endpoint (unofficial but works)
    const translations = await Promise.all(
      texts.map(async (text: string) => {
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${mappedLang}&dt=t&q=${encodeURIComponent(text)}`;
          const response = await fetch(url);
          const data = await response.json();
          
          // Extract translated text from response
          if (data && data[0]) {
            return data[0].map((item: any) => item[0]).join('');
          }
          return text;
        } catch (e) {
          console.error(`Translation error for "${text}":`, e);
          return text; // Return original on error
        }
      })
    );

    return new Response(
      JSON.stringify({ translations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Translation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
