import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp, DollarSign, CalendarDays,
  CheckCircle2, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

/* ============================================================
   Tipos
   ============================================================ */

type Period = "7d" | "30d" | "90d" | "12m";

interface BookingData {
  booking_date: string;
  status: string;
  services: { price: number; name: string } | null;
}

/* ============================================================
   Helpers
   ============================================================ */

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "12m": "12 meses",
};

function getPeriodStart(period: Period): Date {
  const d = new Date();
  if (period === "7d") d.setDate(d.getDate() - 7);
  else if (period === "30d") d.setDate(d.getDate() - 30);
  else if (period === "90d") d.setDate(d.getDate() - 90);
  else d.setMonth(d.getMonth() - 12);
  return d;
}

function groupByDay(bookings: BookingData[]) {
  const map: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.status === "confirmed" || b.status === "completed") {
      const d = b.booking_date;
      map[d] = (map[d] || 0) + (b.services?.price || 0);
    }
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date: new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value,
    }));
}

function groupByMonth(bookings: BookingData[]) {
  const map: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.status === "confirmed" || b.status === "completed") {
      const d = b.booking_date.slice(0, 7);
      map[d] = (map[d] || 0) + (b.services?.price || 0);
    }
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => {
      const [y, m] = month.split("-");
      const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      return { date: `${months[parseInt(m) - 1]}/${y.slice(2)}`, value };
    });
}

function groupByService(bookings: BookingData[]) {
  const map: Record<string, { count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    if (b.status === "confirmed" || b.status === "completed") {
      const name = b.services?.name || "Sem serviço";
      if (!map[name]) map[name] = { count: 0, revenue: 0 };
      map[name].count++;
      map[name].revenue += b.services?.price || 0;
    }
  });
  return Object.entries(map)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([name, data]) => ({ name, ...data }));
}

/* ============================================================
   Tooltip customizado
   ============================================================ */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-warm text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

/* ============================================================
   RevenueManager
   ============================================================ */

export default function RevenueManager() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["revenue-bookings", user?.id, period],
    queryFn: async () => {
      const start = getPeriodStart(period);
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date, status, services(price, name)")
        .eq("user_id", user!.id)
        .gte("booking_date", start.toISOString().split("T")[0])
        .order("booking_date", { ascending: true });
      if (error) throw error;
      return data as BookingData[];
    },
    enabled: !!user?.id,
  });

  /* ---- Métricas ---- */
  const confirmed = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );
  const totalRevenue = confirmed.reduce((s, b) => s + (b.services?.price || 0), 0);
  const totalBookings = bookings.length;
  const confirmedCount = confirmed.length;
  const avgTicket = confirmedCount > 0 ? totalRevenue / confirmedCount : 0;

  const chartData = period === "12m" ? groupByMonth(bookings) : groupByDay(bookings);
  const serviceData = groupByService(bookings);

  const statCards = [
    {
      label: "Receita total",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Agendamentos",
      value: totalBookings,
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Confirmados",
      value: confirmedCount,
      icon: CheckCircle2,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(avgTicket),
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Filtro de período */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
              period === p
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card-warm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.bg)}>
                  <Icon className={cn("w-4 h-4", card.color)} />
                </div>
              </div>
              {isLoading ? (
                <div className="h-8 w-20 shimmer rounded" />
              ) : (
                <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Gráfico de receita */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-warm p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Receita por período</h3>
        </div>

        {isLoading ? (
          <div className="h-64 shimmer rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma receita no período selecionado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            {period === "12m" ? (
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 15% 88%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "hsl(20 10% 45%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(20 10% 45%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="hsl(16 70% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 15% 88%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(20 10% 45%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(20 10% 45%)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(16 70% 45%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(16 70% 45%)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Receita por serviço */}
      {serviceData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-warm p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Receita por serviço</h3>
          <div className="space-y-3">
            {serviceData.map((s, i) => {
              const pct = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{s.count} agend.</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(s.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
