import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Busca dados do agendamento
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, services(name, duration, price)")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: "Agendamento não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Envia email de confirmação imediato
    await sendConfirmationEmail(booking);

    // Agenda lembretes
    const bookingDate = new Date(`${booking.booking_date}T${booking.booking_time}`);

    const dayBefore = new Date(bookingDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(9, 0, 0, 0);

    const sameDay = new Date(bookingDate);
    sameDay.setHours(8, 0, 0, 0);

    const now = new Date();

    const emailsToSchedule = [];

    if (dayBefore > now) {
      emailsToSchedule.push({
        booking_id: bookingId,
        email_type: "reminder_day_before",
        scheduled_at: dayBefore.toISOString(),
        status: "pending",
      });
    }

    if (sameDay > now) {
      emailsToSchedule.push({
        booking_id: bookingId,
        email_type: "reminder_same_day",
        scheduled_at: sameDay.toISOString(),
        status: "pending",
      });
    }

    if (emailsToSchedule.length > 0) {
      await supabase.from("booking_emails").insert(emailsToSchedule);
    }

    return new Response(JSON.stringify({ success: true, scheduled: emailsToSchedule.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendConfirmationEmail(booking: any) {
  const service = booking.services;
  const bookingDate = new Date(`${booking.booking_date}T00:00:00`);
  const dateStr = bookingDate.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1210; color: #f0fdf4; padding: 40px 32px; border-radius: 12px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #34d399; margin: 0 0 8px;">Agendamento confirmado!</h1>
        <p style="color: rgba(240,253,244,0.6); margin: 0;">Olá, ${booking.client_name}. Seu agendamento foi recebido com sucesso.</p>
      </div>
      <div style="background: #141a15; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #f0fdf4;">Detalhes do agendamento</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Serviço</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${service?.name}</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Data</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${dateStr}</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Horário</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${booking.booking_time.slice(0,5)}</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Duração</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${service?.duration} minutos</td></tr>
          ${booking.meet_link ? `<tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Google Meet</td><td style="padding: 6px 0; font-size: 14px; text-align: right;"><a href="${booking.meet_link}" style="color: #34d399;">Entrar na reunião</a></td></tr>` : ""}
        </table>
      </div>
      <p style="color: rgba(240,253,244,0.4); font-size: 13px; margin: 0;">Você receberá um lembrete no dia anterior e no dia do agendamento.</p>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
        <p style="color: rgba(240,253,244,0.25); font-size: 12px; margin: 0;">AgendaFlow · by Fluqia</p>
      </div>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AgendaFlow <onboarding@resend.dev>",
      to: booking.client_email,
      subject: `Agendamento confirmado — ${service?.name}`,
      html,
    }),
  });
}
