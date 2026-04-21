import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarDays, Clock, CheckCircle2, XCircle,
  Search, Filter, Phone, Mail, MessageSquare,
  ChevronDown, Loader2, CalendarX, Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { formatCurrency, formatDate, BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BookingWithService {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  client_notes: string | null;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  meet_link: string | null;
  google_event_id: string | null;
  services: { name: string; duration: number; price: number } | null;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
      status === "pending"   && "badge-pending",
      status === "confirmed" && "badge-confirmed",
      status === "cancelled" && "badge-cancelled",
      status === "completed" && "badge-completed",
    )}>
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

function BookingCard({
  booking,
  onConfirm,
  onCancel,
  isActing,
}: {
  booking: BookingWithService;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  isActing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const service = booking.services;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="card-warm overflow-hidden"
    >
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary text-sm font-bold">
            {booking.client_name[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{booking.client_name}</p>
            <StatusBadge status={booking.status} />
            {booking.meet_link && (
              <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Video className="w-3 h-3" /> Meet
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {service?.name} · {formatDate(booking.booking_date)} às {booking.booking_time.slice(0, 5)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-semibold text-foreground hidden sm:block">
            {formatCurrency(service?.price || 0)}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${booking.client_email}`} className="text-primary hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                    {booking.client_email}
                  </a>
                </div>
                {booking.client_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${booking.client_phone}`} className="text-foreground hover:text-primary" onClick={(e) => e.stopPropagation()}>
                      {booking.client_phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{service?.duration} min · {formatCurrency(service?.price || 0)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{formatDate(booking.booking_date)} às {booking.booking_time.slice(0, 5)}</span>
                </div>
              </div>

              {booking.client_notes && (
                <div className="flex items-start gap-2 text-sm bg-muted/40 rounded-lg p-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">{booking.client_notes}</p>
                </div>
              )}

              {booking.meet_link && (
                <a
                  href={booking.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Video className="w-4 h-4" />
                  Abrir Google Meet
                </a>
              )}

              {(booking.status === "pending" || booking.status === "confirmed") && (
                <div className="flex gap-2 pt-1">
                  {booking.status === "pending" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onConfirm(booking.id); }}
                      disabled={isActing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirmar
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onCancel(booking.id); }}
                    disabled={isActing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const STATUS_FILTERS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "Todos",       value: "all" },
  { label: "Pendentes",   value: "pending" },
  { label: "Confirmados", value: "confirmed" },
  { label: "Concluídos",  value: "completed" },
  { label: "Cancelados",  value: "cancelled" },
];

export default function BookingsList() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select("*, services(name, duration, price)")
        .eq("user_id", user!.id)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as BookingWithService[];
    },
    enabled: !!user?.id,
  });

  const { mutateAsync: updateStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-bookings"] });
    },
  });

  async function callEdgeFunction(body: object): Promise<any> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || supabaseKey;
    const resp = await fetch(
      `${supabaseUrl}/functions/v1/google-calendar-integration`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify(body),
      }
    );
    return resp.json();
  }

  async function handleConfirm(id: string) {
    setActingId(id);
    try {
      await updateStatus({ id, status: "confirmed" });

      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      const hasCalendar = await supabase.rpc("has_google_calendar_connected", {
        p_user_id: user!.id,
      });

      if (hasCalendar.data) {
        try {
          const calData = await callEdgeFunction({
            userId: user!.id,
            action: "create",
            booking: {
              id: booking.id,
              booking_date: booking.booking_date,
              booking_time: booking.booking_time,
              client_name: booking.client_name,
              client_email: booking.client_email,
              client_phone: booking.client_phone,
              client_notes: booking.client_notes,
              service_name: booking.services?.name,
              duration: booking.services?.duration,
              timezone: profile?.timezone || "America/Sao_Paulo",
            },
          });

          if (calData?.eventId) {
            await supabase
              .from("bookings")
              .update({
                google_event_id: calData.eventId,
                meet_link: calData.meetLink || null,
              })
              .eq("id", id);
          }
        } catch (calErr) {
          console.error("Erro Google Calendar:", calErr);
        }
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`${supabaseUrl}/functions/v1/schedule-booking-emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || supabaseKey}`,
            "apikey": supabaseKey,
          },
          body: JSON.stringify({ bookingId: id }),
        });
      } catch (emailErr) {
        console.error("Erro ao agendar emails:", emailErr);
      }

      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Agendamento confirmado!");

    } catch {
      toast.error("Erro ao confirmar agendamento.");
    } finally {
      setActingId(null);
    }
  }

  async function handleCancel(id: string) {
    setActingId(id);
    try {
      const booking = bookings.find((b) => b.id === id);

      if (booking?.google_event_id) {
        try {
          await callEdgeFunction({
            userId: user!.id,
            action: "delete",
            booking: { google_event_id: booking.google_event_id },
          });
        } catch (calErr) {
          console.error("Erro ao deletar evento:", calErr);
        }
      }

      await updateStatus({ id, status: "cancelled" });
      toast.success("Agendamento cancelado.");
    } catch {
      toast.error("Erro ao cancelar agendamento.");
    } finally {
      setActingId(null);
    }
  }

  const filtered = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.client_name.toLowerCase().includes(q) ||
      b.client_email.toLowerCase().includes(q) ||
      b.services?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou serviço..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 flex-shrink-0 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150",
                statusFilter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>
          {filtered.length} {filtered.length === 1 ? "agendamento" : "agendamentos"}
          {search && ` para "${search}"`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CalendarX className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">
            {search ? "Nenhum resultado encontrado" : "Nenhum agendamento ainda"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {search ? "Tente buscar por outro nome ou email." : "Quando seus clientes fizerem agendamentos, eles aparecerão aqui."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isActing={actingId === booking.id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
