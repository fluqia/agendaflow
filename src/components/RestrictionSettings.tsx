import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ShieldAlert, Clock, CalendarDays, ToggleLeft,
  ToggleRight, Loader2, CheckCircle2, Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/* ============================================================
   Hook de configurações
   ============================================================ */

function useAppSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { mutateAsync: saveSettings, isPending: saving } = useMutation({
    mutationFn: async (values: {
      min_advance_hours: number;
      max_advance_days: number;
      allow_same_day: boolean;
    }) => {
      const { error } = await supabase
        .from("app_settings")
        .update(values)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { settings, isLoading, saveSettings, saving };
}

/* ============================================================
   Componente principal
   ============================================================ */

export default function RestrictionSettings() {
  const { settings, isLoading, saveSettings, saving } = useAppSettings();

  const [minAdvanceHours, setMinAdvanceHours] = useState(1);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
  const [allowSameDay, setAllowSameDay] = useState(true);

  useEffect(() => {
    if (settings) {
      setMinAdvanceHours(settings.min_advance_hours);
      setMaxAdvanceDays(settings.max_advance_days);
      setAllowSameDay(settings.allow_same_day);
    }
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (minAdvanceHours < 0) return toast.error("Antecedência mínima não pode ser negativa");
    if (maxAdvanceDays < 1) return toast.error("Antecedência máxima deve ser pelo menos 1 dia");
    await saveSettings({
      min_advance_hours: minAdvanceHours,
      max_advance_days: maxAdvanceDays,
      allow_same_day: allowSameDay,
    });
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Intro */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Configure as regras de agendamento que seus clientes devem seguir ao usar sua página pública.
          Essas configurações ajudam a evitar agendamentos de última hora ou com muita antecedência.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Antecedência mínima */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-warm p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Antecedência mínima</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Com quantas horas de antecedência o cliente pode agendar. Use 0 para permitir agendamentos imediatos.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="number"
                value={minAdvanceHours}
                onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                min={0}
                max={168}
                className={inputClass}
              />
            </div>
            <span className="text-sm text-muted-foreground flex-shrink-0">horas</span>
          </div>

          {/* Preview */}
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 4, 8, 24, 48].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setMinAdvanceHours(h)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  minAdvanceHours === h
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {h === 0 ? "Imediato" : h === 1 ? "1h" : h < 24 ? `${h}h` : `${h/24}d`}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Antecedência máxima */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-warm p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Antecedência máxima</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Com quantos dias de antecedência o cliente pode agendar. Evita agendamentos muito distantes no futuro.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="number"
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
                min={1}
                max={365}
                className={inputClass}
              />
            </div>
            <span className="text-sm text-muted-foreground flex-shrink-0">dias</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[7, 14, 30, 60, 90, 180, 365].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMaxAdvanceDays(d)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  maxAdvanceDays === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {d < 30 ? `${d}d` : d < 365 ? `${d/30}m` : "1 ano"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Permitir mesmo dia */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-warm p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Permitir agendamento no mesmo dia</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Se desativado, clientes não podem agendar para o dia atual, independente da antecedência mínima.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowSameDay((v) => !v)}
              className="flex-shrink-0 ml-4"
            >
              {allowSameDay
                ? <ToggleRight className="w-8 h-8 text-primary" />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
              }
            </button>
          </div>
        </motion.div>

        {/* Resumo das regras */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/50 rounded-xl p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Resumo das regras ativas
          </p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              {minAdvanceHours === 0
                ? "Agendamentos imediatos permitidos"
                : `Mínimo ${minAdvanceHours}h de antecedência`}
            </li>
            <li className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              {`Máximo ${maxAdvanceDays} dias de antecedência`}
            </li>
            <li className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              {allowSameDay
                ? "Agendamentos no mesmo dia permitidos"
                : "Agendamentos no mesmo dia bloqueados"}
            </li>
          </ul>
        </motion.div>

        {/* Salvar */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {saving
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <CheckCircle2 className="w-5 h-5" />
          }
          Salvar configurações
        </button>
      </form>
    </div>
  );
}
