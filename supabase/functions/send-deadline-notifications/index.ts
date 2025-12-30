import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Obligation {
  id: string;
  title: string;
  deadline: string;
  status: string;
  user_id: string;
  risk_level: string;
}

interface Profile {
  email: string;
  full_name: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Compliance <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error}`);
  }

  return res.json();
}

function formatDeadlineEmail(obligations: Obligation[], userName: string): string {
  const obligationsList = obligations
    .map(o => {
      const deadline = new Date(o.deadline);
      const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const riskColor = o.risk_level === 'critical' ? '#dc2626' : 
                        o.risk_level === 'high' ? '#ea580c' : 
                        o.risk_level === 'medium' ? '#ca8a04' : '#16a34a';
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${o.title}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${deadline.toLocaleDateString('it-IT')}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: ${daysUntil <= 0 ? '#dc2626' : daysUntil <= 7 ? '#ea580c' : '#16a34a'}">
              ${daysUntil <= 0 ? 'SCADUTO' : `${daysUntil} giorni`}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <span style="background-color: ${riskColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
              ${o.risk_level?.toUpperCase() || 'MEDIO'}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Notifica Scadenze Compliance</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Notifica Scadenze</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Sistema di Compliance Aziendale</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Ciao <strong>${userName}</strong>,</p>
        <p>Hai <strong>${obligations.length}</strong> obbligh${obligations.length === 1 ? 'o' : 'i'} in scadenza che richied${obligations.length === 1 ? 'e' : 'ono'} la tua attenzione:</p>
        
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin: 20px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Obbligo</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Scadenza</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Tempo</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Rischio</th>
            </tr>
          </thead>
          <tbody>
            ${obligationsList}
          </tbody>
        </table>
        
        <p style="margin-top: 20px;">
          <a href="${SUPABASE_URL.replace('.supabase.co', '.lovable.app')}/obligations" 
             style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Vai agli Obblighi →
          </a>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Questa email è stata inviata automaticamente dal sistema di compliance.
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get upcoming deadlines (next 30 days) that are not completed
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: obligations, error: oblError } = await supabase
      .from('obligations')
      .select('*')
      .neq('status', 'completed')
      .lte('deadline', thirtyDaysFromNow.toISOString())
      .order('deadline', { ascending: true });

    if (oblError) {
      console.error("Error fetching obligations:", oblError);
      throw oblError;
    }

    if (!obligations || obligations.length === 0) {
      console.log("No upcoming deadlines found");
      return new Response(
        JSON.stringify({ message: "No upcoming deadlines", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by user
    const userObligations = new Map<string, Obligation[]>();
    for (const obl of obligations) {
      const existing = userObligations.get(obl.user_id) || [];
      existing.push(obl);
      userObligations.set(obl.user_id, existing);
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const [userId, userObls] of userObligations) {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error(`No profile found for user ${userId}:`, profileError);
        continue;
      }

      // Filter to only include obligations in next 7 days or overdue
      const urgentObligations = userObls.filter(o => {
        const daysUntil = Math.ceil((new Date(o.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 7;
      });

      if (urgentObligations.length === 0) continue;

      try {
        const html = formatDeadlineEmail(urgentObligations, profile.full_name || 'Utente');
        await sendEmail(
          profile.email,
          `⚠️ ${urgentObligations.length} scadenz${urgentObligations.length === 1 ? 'a' : 'e'} in arrivo`,
          html
        );
        sentCount++;
        console.log(`Email sent to ${profile.email} for ${urgentObligations.length} obligations`);
      } catch (emailError) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
        errors.push(`${profile.email}: ${emailError}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Notifications processed", 
        sent: sentCount,
        totalUsers: userObligations.size,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-deadline-notifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
