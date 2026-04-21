import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CalendarDays, TrendingUp, Clock, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, CalendarX,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import ServicesManager from "@/components/ServicesManager";
import AvailabilityManager from "@/components/AvailabilityManager";
import BookingsList from "@/components/BookingsList";
import ProfileSettings from "@/components/ProfileSettings";
import RevenueManager from "@/components/RevenueManager";
import RestrictionSettings from "@/components/RestrictionSettings";
import { formatCurrency, formatDate, BOOKING_STATUS_LABELS, type BookingStatus } from "@/lib/utils";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("status, services(price)")
        .eq("user_id", user.id)
        .gte("booking_date", startOfMonth.toISOString().split("T")[0]);
      if (!bookings) return null;
      return {
        total: bookings.length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        pending: bookings.filter((b) => b.status === "pending").length,
        revenue: bookings
          .filter((b) => b.status === "confirmed" || b.status === "completed")
          .reduce((sum, b) => {
            const s = b.services as { price?: number } | null;
            return sum + (s?.price || 0);
          }, 0),
      };
    },
    enabled: !!user?.id,
  });

  const { data: upcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming-bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("bookings")
        .select("*, services(name, duration, price)")
        .eq("user_id", user.id)
        .gte("booking_date", today)
        .in("status", ["pending", "confirmed"])
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const statCards = [
    { label: "Agendamentos este mês", value: metrics?.total ?? 0, icon: CalendarDays, color: "text-primary", bg: "bg-primary/10" },
    { label: "Confirmados", value: metrics?.confirmed ?? 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pendentes", value: metrics?.pending ?? 0, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Receita do mês", value: formatCurrency(metrics?.revenue ?? 0), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", isString: true },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="font-display text-3xl font-bold text-foreground mb-1">
          {greeting()}, {profile?.name?.split(" ")[0] || "prestador"}! 👋
        </h2>
        <p className="text-muted-foreground">Aqui está um resumo do seu negócio este mês.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card-warm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground leading-tight">{card.label}</p>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.bg)}>
                  <Icon className={cn("w-4 h-4", card.color)} />
                </div>
              </div>
              {metricsLoading ? <div className="h-8 w-16 shimmer rounded" /> : (
                <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card-warm overflow-hidden">
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Próximos agendamentos</h3>
        </div>
        {upcomingLoading ? (
          <div className="p-6 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 shimmer rounded-lg" />)}</div>
        ) : upcoming && upcoming.length > 0 ? (
          <div className="divide-y divide-border">
            {upcoming.map((booking: any, i: number) => {
              const service = booking.services as { name?: string; price?: number } | null;
              return (
                <motion.div key={booking.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.06 }} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm font-semibold">{booking.client_name[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{booking.client_name}</p>
                      <p className="text-xs text-muted-foreground">{service?.name} · {booking.booking_time.slice(0,5)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium text-foreground">{formatDate(booking.booking_date)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(service?.price || 0)}</p>
                    </div>
                    <span className={cn("badge text-xs px-2.5 py-1 rounded-full",
                      booking.status === "pending" && "badge-pending",
                      booking.status === "confirmed" && "badge-confirmed",
                    )}>
                      {BOOKING_STATUS_LABELS[booking.status as BookingStatus]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum agendamento próximo.</p>
          </div>
        )}
      </motion.div>

      {profile?.custom_url_slug && (
        <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          href={`/book/${profile.custom_url_slug}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-xl border border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div>
            <p className="text-sm font-medium text-foreground">Sua página de agendamento</p>
            <p className="text-xs text-primary mt-0.5">/book/{profile.custom_url_slug}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
        </motion.a>
      )}
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  function renderSection() {
    switch (activeSection) {
      case "dashboard":       return <DashboardContent />;
      case "agendamentos":    return <BookingsList />;
      case "servicos":        return <ServicesManager />;
      case "disponibilidade": return <AvailabilityManager />;
      case "receitas":        return <RevenueManager />;
      case "restricoes":      return <RestrictionSettings />;
      case "perfil":          return <ProfileSettings />;
      default:                return <DashboardContent />;
    }
  }

  return (
    <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </Layout>
  );
}
