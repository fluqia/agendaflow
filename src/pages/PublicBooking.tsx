import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Wifi,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PublicService } from "@/integrations/supabase/types";

/* ============================================================
   Tipos
   ============================================================ */

interface ProviderProfile {
  user_id: string;
  name: string;
  business_name: string | null;
  description: string | null;
  profile_image_url: string | null;
}

interface SlotResult {
  slot_time: string;
  is_available: boolean;
}

type Step = "service" | "datetime" | "form" | "success";

/* ============================================================
   Helpers de data
   ============================================================ */

const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function formatDatePT(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });
}

function isoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

/* ============================================================
   Calendário mini
   ============================================================ */

function MiniCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Dias do mês
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="w-full">
      {/* Cabeçalho do mês */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={viewDate <= new Date(today.getFullYear(), today.getMonth(), 1)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">
          {MONTHS_PT[month]} {year}
        </p>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Células */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;

          const isPast = date < today;
          const isSelected = selected && isoDate(date) === isoDate(selected);
          const isToday = isoDate(date) === isoDate(today);

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onSelect(date)}
              className={cn(
                "aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-150",
                isPast && "text-muted-foreground/30 cursor-not-allowed",
                !isPast && !isSelected && "hover:bg-muted text-foreground",
                isToday && !isSelected && "font-bold text-primary",
                isSelected && "bg-primary text-primary-foreground font-semibold",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Página principal
   ============================================================ */

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Form fields
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  /* ---- Query: perfil do prestador pelo slug ---- */
  const { data: provider, isLoading: loadingProvider, error: providerError } = useQuery({
    queryKey: ["public-provider", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, business_name, description, profile_image_url")
        .eq("custom_url_slug", slug)
        .single();
      if (error) throw error;
      return data as ProviderProfile;
    },
    enabled: !!slug,
  });

  /* ---- Query: serviços públicos ---- */
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ["public-services", provider?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_services")
        .select("*")
        .eq("user_id", provider!.user_id);
      if (error) throw error;
      return data as PublicService[];
    },
    enabled: !!provider?.user_id,
  });

  /* ---- Query: slots disponíveis ---- */
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["public-slots", provider?.user_id, selectedDate, selectedService?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_user_id: provider!.user_id,
        p_date: isoDate(selectedDate!),
        p_service_id: selectedService!.id,
      });
      if (error) throw error;
      return (data || []) as SlotResult[];
    },
    enabled: !!provider?.user_id && !!selectedDate && !!selectedService,
  });

  /* ---- Mutation: criar agendamento ---- */
  const { mutateAsync: createBooking, isPending: booking } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bookings").insert({
        user_id: provider!.user_id,
        service_id: selectedService!.id,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim() || null,
        client_notes: clientNotes.trim() || null,
        booking_date: isoDate(selectedDate!),
        booking_time: selectedSlot!,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => setStep("success"),
    onError: (e: Error) => alert("Erro ao agendar: " + e.message),
  });

  /* ---- Loading / Erro ---- */
  if (loadingProvider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (providerError || !provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground">
            Este link de agendamento não existe ou foi desativado.
          </p>
        </div>
      </div>
    );
  }

  /* ---- Render por step ---- */

  return (
    <div className="min-h-screen bg-background">
      {/* Header do prestador */}
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            {provider.profile_image_url ? (
              <img src={provider.profile_image_url} alt={provider.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-primary">
                {provider.name[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {provider.business_name || provider.name}
            </h1>
            {provider.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {provider.description}
              </p>
            )}
          </div>
        </div>

        {/* Steps indicator */}
        {step !== "success" && (
          <div className="max-w-2xl mx-auto px-4 pb-4">
            <div className="flex items-center gap-2">
              {(["service", "datetime", "form"] as Step[]).map((s, i) => {
                const steps: Step[] = ["service", "datetime", "form"];
                const currentIdx = steps.indexOf(step);
                const stepIdx = steps.indexOf(s);
                const labels = ["Serviço", "Data & Hora", "Seus dados"];
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                      stepIdx < currentIdx && "bg-primary text-primary-foreground",
                      stepIdx === currentIdx && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                      stepIdx > currentIdx && "bg-muted text-muted-foreground",
                    )}>
                      {stepIdx < currentIdx ? "✓" : i + 1}
                    </div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:block",
                      stepIdx === currentIdx ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {labels[i]}
                    </span>
                    {i < 2 && <div className={cn("flex-1 h-px", stepIdx < currentIdx ? "bg-primary" : "bg-border")} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo por step */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* STEP 1: Escolher serviço */}
          {step === "service" && (
            <motion.div
              key="service"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-4"
            >
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  Escolha o serviço
                </h2>
                <p className="text-muted-foreground text-sm">
                  Selecione o serviço que deseja agendar.
                </p>
              </div>

              {loadingServices ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-24 shimmer rounded-xl" />)}
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
                </div>
              ) : (
                services.map((service) => (
                  <motion.button
                    key={service.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedDate(null);
                      setSelectedSlot(null);
                      setStep("datetime");
                    }}
                    className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-warm transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {service.type === "online"
                            ? <Wifi className="w-5 h-5 text-primary" />
                            : <MapPin className="w-5 h-5 text-primary" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(service.duration)}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              service.type === "online" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"
                            )}>
                              {service.type === "online" ? "Online" : "Presencial"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-foreground text-lg">
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </motion.div>
          )}

          {/* STEP 2: Escolher data e hora */}
          {step === "datetime" && selectedService && (
            <motion.div
              key="datetime"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep("service")}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Escolha data e hora
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedService.name} · {formatDuration(selectedService.duration)}
                  </p>
                </div>
              </div>

              {/* Calendário */}
              <div className="card-warm p-5">
                <MiniCalendar
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedSlot(null);
                  }}
                />
              </div>

              {/* Slots de horário */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Horários disponíveis — {formatDatePT(selectedDate)}
                  </p>

                  {loadingSlots ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="h-10 shimmer rounded-lg" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-xl">
                      <p className="text-muted-foreground text-sm">
                        Nenhum horário disponível neste dia.
                      </p>
                      <p className="text-muted-foreground/60 text-xs mt-1">
                        Tente outra data.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.slot_time}
                          disabled={!slot.is_available}
                          onClick={() => setSelectedSlot(slot.slot_time)}
                          className={cn(
                            "py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border",
                            !slot.is_available && "bg-muted text-muted-foreground/40 border-border cursor-not-allowed line-through",
                            slot.is_available && selectedSlot !== slot.slot_time && "bg-card border-border hover:border-primary hover:bg-primary/5 text-foreground",
                            slot.is_available && selectedSlot === slot.slot_time && "bg-primary border-primary text-primary-foreground",
                          )}
                        >
                          {slot.slot_time.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Continuar */}
              {selectedSlot && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep("form")}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors"
                >
                  Continuar → {selectedSlot.slice(0, 5)}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* STEP 3: Formulário de dados */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep("datetime")}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Seus dados
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedService?.name} · {selectedDate && formatDatePT(selectedDate)} · {selectedSlot?.slice(0,5)}
                  </p>
                </div>
              </div>

              {/* Resumo do agendamento */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedService?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDate && formatDatePT(selectedDate)} às {selectedSlot?.slice(0,5)} · {formatCurrency(selectedService?.price || 0)}
                  </p>
                </div>
              </div>

              {/* Campos */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Nome completo <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Observações
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Alguma informação importante para o prestador..."
                      rows={3}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                disabled={booking || !clientName.trim() || !clientEmail.trim()}
                onClick={() => createBooking()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {booking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Confirmar agendamento
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Ao confirmar, você receberá um email de confirmação.
              </p>
            </motion.div>
          )}

          {/* STEP 4: Sucesso */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </motion.div>

              <h2 className="font-display text-3xl font-bold text-foreground mb-3">
                Agendado com sucesso!
              </h2>
              <p className="text-muted-foreground mb-2">
                Seu agendamento foi recebido e está aguardando confirmação.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Você receberá um email de confirmação em breve.
              </p>

              <div className="card-warm p-5 text-left max-w-sm mx-auto mb-8">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Resumo
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviço</span>
                    <span className="font-medium text-foreground">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span className="font-medium text-foreground">
                      {selectedDate && formatDatePT(selectedDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horário</span>
                    <span className="font-medium text-foreground">{selectedSlot?.slice(0,5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium text-foreground">{formatCurrency(selectedService?.price || 0)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep("service");
                  setSelectedService(null);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                  setClientName("");
                  setClientEmail("");
                  setClientPhone("");
                  setClientNotes("");
                }}
                className="text-sm text-primary hover:underline"
              >
                Fazer outro agendamento
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-12 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-semibold text-primary">Agendfy</span> · by Fluqia
        </p>
      </div>
    </div>
  );
}
