import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://agendaflow-nu.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Valida o JWT do usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Token de autenticação obrigatório" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verifica quem é o usuário autenticado pelo JWT
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, action, booking, code, redirectUri } = await req.json();

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: "userId e action são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Garante que o userId do body bate com o usuário autenticado
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Trocar code por tokens (OAuth callback) ----
    if (action === "exchange_code") {
      if (!code || !redirectUri) {
        return new Response(JSON.stringify({ error: "code e redirectUri são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResp.ok) {
        const err = await tokenResp.json();
        throw new Error(`Erro ao trocar code: ${JSON.stringify(err)}`);
      }

      const tokens = await tokenResp.json();

      await supabase.rpc("store_google_token", {
        p_user_id: userId,
        p_access_token: tokens.access_token,
        p_refresh_token: tokens.refresh_token,
        p_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Busca e refresh de token ----
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      "get_google_token_for_edge_function",
      { p_user_id: userId }
    );

    if (tokenError || !tokenData?.length) {
      return new Response(JSON.stringify({ error: "Google Calendar não conectado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let { access_token, refresh_token, expires_at } = tokenData[0];

    if (expires_at && new Date(expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(refresh_token);
      if (!refreshed) {
        return new Response(JSON.stringify({ error: "Falha ao renovar token do Google" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      access_token = refreshed.access_token;
      await supabase.rpc("store_google_token", {
        p_user_id: userId,
        p_access_token: refreshed.access_token,
        p_refresh_token: refresh_token,
        p_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      });
    }

    let result = {};

    if (action === "create" && booking) {
      result = await createCalendarEvent(access_token, booking);
    } else if (action === "delete" && booking?.google_event_id) {
      await deleteCalendarEvent(access_token, booking.google_event_id);
      result = { deleted: true };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function refreshAccessToken(refreshToken: string) {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function createCalendarEvent(accessToken: string, booking: any) {
  const startDateTime = `${booking.booking_date}T${booking.booking_time}-03:00`;
  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + booking.duration * 60000);

  const event = {
    summary: `${booking.service_name} — ${booking.client_name}`,
    description: `Cliente: ${booking.client_name}\nEmail: ${booking.client_email}\n${booking.client_phone ? `Telefone: ${booking.client_phone}` : ""}${booking.client_notes ? `\nObservações: ${booking.client_notes}` : ""}`,
    start: { dateTime: start.toISOString(), timeZone: booking.timezone || "America/Sao_Paulo" },
    end: { dateTime: end.toISOString(), timeZone: booking.timezone || "America/Sao_Paulo" },
    attendees: [{ email: booking.client_email }],
    conferenceData: {
      createRequest: {
        requestId: `agendaflow-${booking.id}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const resp = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`Erro ao criar evento: ${JSON.stringify(err)}`);
  }

  const data = await resp.json();
  return {
    eventId: data.id,
    meetLink: data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri || null,
  };
}

async function deleteCalendarEvent(accessToken: string, eventId: string) {
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}