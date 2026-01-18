import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://id-preview--c4ad59e0-c994-426e-a9e5-8f946f97755d.lovable.app",
  "https://riskboard.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per user

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

// Clean up old entries periodically
const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const [userId, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(userId);
    }
  }
};

// Check and update rate limit for a user
const checkRateLimit = (userId: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  userLimit.count++;
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count, 
    resetIn: RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart) 
  };
};

// Sanitize text fields to prevent prompt injection
const sanitizeText = (text: string | null | undefined, maxLength = 500): string => {
  if (!text) return "";
  return text
    .replace(/IGNORE\s*(ALL\s*)?(PREVIOUS\s*)?(INSTRUCTIONS?)?/gi, "")
    .replace(/SYSTEM\s*(PROMPT)?/gi, "")
    .replace(/\bASSISTANT\b/gi, "")
    .replace(/\bUSER\b:/gi, "")
    .replace(/```/g, "")
    .slice(0, maxLength)
    .trim();
};

// Sanitize obligation objects
const sanitizeObligation = (obligation: any) => ({
  id: obligation.id,
  title: sanitizeText(obligation.title, 200),
  description: sanitizeText(obligation.description, 500),
  category: obligation.category,
  deadline: obligation.deadline,
  status: obligation.status,
  risk_level: obligation.risk_level,
  notes: sanitizeText(obligation.notes, 300),
});

// Sanitize company object
const sanitizeCompany = (company: any) => {
  if (!company) return null;
  return {
    name: sanitizeText(company.name, 200),
    industry: sanitizeText(company.industry, 100),
    employee_count: company.employee_count,
  };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let requestType: string = "unknown";
  let logStatus: string = "success";
  let errorMessage: string | null = null;
  let tokensUsed: number | null = null;

  // Helper to log request to database
  const logRequest = async (supabaseAdmin: any) => {
    try {
      const responseTimeMs = Date.now() - startTime;
      await supabaseAdmin.from('ai_request_logs').insert({
        user_id: userId,
        request_type: requestType,
        status: logStatus,
        response_time_ms: responseTimeMs,
        tokens_used: tokensUsed,
        error_message: errorMessage,
        metadata: {
          rate_limit_remaining: rateLimitStore.get(userId || '')?.count || 0
        }
      });
      console.log(`AI request logged: ${requestType}, status: ${logStatus}, time: ${responseTimeMs}ms`);
    } catch (logError) {
      console.error("Failed to log AI request:", logError);
    }
  };

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Create admin client for logging (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    userId = user.id;

    // Apply rate limiting per user
    cleanupRateLimitStore();
    const rateLimit = checkRateLimit(user.id);
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      logStatus = "rate_limited";
      requestType = "rate_limit_exceeded";
      await logRequest(supabaseAdmin);
      
      return new Response(
        JSON.stringify({ 
          error: `Troppe richieste. Riprova tra ${Math.ceil(rateLimit.resetIn / 1000)} secondi.`,
          retry_after: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    console.log(`AI insights request from user: ${user.id} (remaining: ${rateLimit.remaining}/${MAX_REQUESTS_PER_WINDOW})`);

    const { type, obligations, company } = await req.json();
    requestType = type || "unknown";
    
    // Sanitize all input data
    const sanitizedObligations = Array.isArray(obligations) 
      ? obligations.map(sanitizeObligation) 
      : [];
    const sanitizedCompany = sanitizeCompany(company);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "risk_analysis":
        systemPrompt = `Sei un esperto consulente di compliance aziendale italiano. Analizza gli obblighi forniti e genera un'analisi dei rischi concisa e professionale in italiano. Fornisci raccomandazioni pratiche e prioritizzate.`;
        userPrompt = `Analizza questi obblighi di compliance e genera un report sui rischi:\n\n${JSON.stringify(sanitizedObligations, null, 2)}`;
        break;
      
      case "compliance_score":
        systemPrompt = `Sei un analista di compliance. Calcola un punteggio di compliance basato sugli obblighi forniti, considerando scadenze, stato e gravità delle penali. Rispondi in italiano con un punteggio da 0-100 e una breve spiegazione.`;
        userPrompt = `Calcola il punteggio di compliance per questi obblighi:\n\n${JSON.stringify(sanitizedObligations, null, 2)}`;
        break;
      
      case "recommendations":
        systemPrompt = `Sei un consulente strategico di compliance aziendale. Fornisci 3-5 raccomandazioni prioritarie basate sulla situazione attuale. Rispondi in italiano in modo conciso e azionabile.`;
        userPrompt = `Basandoti su questi obblighi e sul profilo aziendale, genera raccomandazioni:\n\nAzienda: ${JSON.stringify(sanitizedCompany)}\nObblighi: ${JSON.stringify(sanitizedObligations)}`;
        break;
      
      case "deadline_summary":
        systemPrompt = `Sei un assistente di gestione scadenze. Genera un riepilogo esecutivo delle scadenze imminenti e delle azioni necessarie. Rispondi in italiano.`;
        userPrompt = `Genera un riepilogo delle scadenze per questi obblighi:\n\n${JSON.stringify(sanitizedObligations, null, 2)}`;
        break;
      
      default:
        systemPrompt = `Sei un esperto assistente di compliance aziendale italiano. Fornisci risposte concise e professionali.`;
        userPrompt = `Analizza questi dati di compliance:\n\n${JSON.stringify({ obligations: sanitizedObligations, company: sanitizedCompany }, null, 2)}`;
    }

    console.log(`Processing AI insight request: ${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      logStatus = "error";
      
      if (response.status === 429) {
        errorMessage = "AI gateway rate limit exceeded";
        await logRequest(supabaseAdmin);
        return new Response(
          JSON.stringify({ error: "Limite richieste superato, riprova più tardi." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        errorMessage = "AI credits exhausted";
        await logRequest(supabaseAdmin);
        return new Response(
          JSON.stringify({ error: "Crediti esauriti, ricarica il tuo account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      errorMessage = `AI gateway error: ${response.status}`;
      console.error("AI gateway error:", response.status, errorText);
      await logRequest(supabaseAdmin);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Nessuna analisi disponibile.";
    
    // Extract token usage if available
    tokensUsed = data.usage?.total_tokens || null;

    console.log(`AI insight generated successfully for type: ${type}`);

    // Log successful request
    await logRequest(supabaseAdmin);

    return new Response(
      JSON.stringify({ 
        insight: content,
        type,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-insights function:", error);
    logStatus = "error";
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Try to log the error (create admin client if not already created)
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      if (userId) {
        await supabaseAdmin.from('ai_request_logs').insert({
          user_id: userId,
          request_type: requestType,
          status: logStatus,
          response_time_ms: Date.now() - startTime,
          error_message: errorMessage
        });
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
