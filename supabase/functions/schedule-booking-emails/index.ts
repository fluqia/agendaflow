import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Só permite chamadas internas via service_role
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Acesso negado" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    const { data: pendingEmails, error } = await supabase
      .from("booking_emails")
      .select("*, bookings(*, services(name, duration))")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(50);

    if (error) throw error;
    if (!pendingEmails?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        await sendReminderEmail(email);
        await supabase.from("booking_emails").update({ status: "sent" }).eq("id", email.id);
        processed++;
      } catch (err) {
        console.error(`Erro ao enviar email ${email.id}:`, err);
        await supabase.from("booking_emails").update({ status: "failed" }).eq("id", email.id);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});

async function sendReminderEmail(email: any) {
  const booking = email.bookings;
  const service = booking?.services;

  const isYesterday = email.email_type === "reminder_day_before";
  const bookingDate = new Date(`${booking.booking_date}T00:00:00`);
  const dateStr = bookingDate.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });

  const subject = isYesterday
    ? `Lembrete: seu agendamento é amanhã — ${service?.name}`
    : `Lembrete: seu agendamento é hoje às ${booking.booking_time.slice(0,5)} — ${service?.name}`;

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1210; color: #f0fdf4; padding: 40px 32px; border-radius: 12px;">
      <h1 style="font-size: 22px; font-weight: 700; color: #34d399; margin: 0 0 8px;">
        ${isYesterday ? "Seu agendamento é amanhã!" : "Seu agendamento é hoje!"}
      </h1>
      <p style="color: rgba(240,253,244,0.6); margin: 0 0 24px;">Olá, ${booking.client_name}. Este é um lembrete do seu agendamento.</p>
      <div style="background: #141a15; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Serviço</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${service?.name}</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Data</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${dateStr}</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Horário</td><td style="padding: 6px 0; font-size: 14px; text-align: right;">${booking.booking_time.slice(0,5)}</td></tr>
          ${booking.meet_link ? `<tr><td style="padding: 6px 0; color: rgba(240,253,244,0.5); font-size: 14px;">Google Meet</td><td style="padding: 6px 0; font-size: 14px; text-align: right;"><a href="${booking.meet_link}" style="color: #34d399;">Entrar na reunião</a></td></tr>` : ""}
        </table>
      </div>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08);">
        <p style="color: rgba(240,253,244,0.25); font-size: 12px; margin: 0;">AgendaFlow · by Fluqia</p>
      </div>
    </div>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AgendaFlow <onboarding@resend.dev>",
      to: booking.client_email,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}