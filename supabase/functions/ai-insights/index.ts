import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, obligations, company } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "risk_analysis":
        systemPrompt = `Sei un esperto consulente di compliance aziendale italiano. Analizza gli obblighi forniti e genera un'analisi dei rischi concisa e professionale in italiano. Fornisci raccomandazioni pratiche e prioritizzate.`;
        userPrompt = `Analizza questi obblighi di compliance e genera un report sui rischi:\n\n${JSON.stringify(obligations, null, 2)}`;
        break;
      
      case "compliance_score":
        systemPrompt = `Sei un analista di compliance. Calcola un punteggio di compliance basato sugli obblighi forniti, considerando scadenze, stato e gravità delle penali. Rispondi in italiano con un punteggio da 0-100 e una breve spiegazione.`;
        userPrompt = `Calcola il punteggio di compliance per questi obblighi:\n\n${JSON.stringify(obligations, null, 2)}`;
        break;
      
      case "recommendations":
        systemPrompt = `Sei un consulente strategico di compliance aziendale. Fornisci 3-5 raccomandazioni prioritarie basate sulla situazione attuale. Rispondi in italiano in modo conciso e azionabile.`;
        userPrompt = `Basandoti su questi obblighi e sul profilo aziendale, genera raccomandazioni:\n\nAzienda: ${JSON.stringify(company)}\nObblighi: ${JSON.stringify(obligations)}`;
        break;
      
      case "deadline_summary":
        systemPrompt = `Sei un assistente di gestione scadenze. Genera un riepilogo esecutivo delle scadenze imminenti e delle azioni necessarie. Rispondi in italiano.`;
        userPrompt = `Genera un riepilogo delle scadenze per questi obblighi:\n\n${JSON.stringify(obligations, null, 2)}`;
        break;
      
      default:
        systemPrompt = `Sei un esperto assistente di compliance aziendale italiano. Fornisci risposte concise e professionali.`;
        userPrompt = `Analizza questi dati di compliance:\n\n${JSON.stringify({ obligations, company }, null, 2)}`;
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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite richieste superato, riprova più tardi." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti esauriti, ricarica il tuo account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Nessuna analisi disponibile.";

    console.log(`AI insight generated successfully for type: ${type}`);

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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
