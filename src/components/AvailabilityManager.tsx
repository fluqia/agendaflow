import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Clock,
  Plus,
  Trash2,
  X,
  Loader2,
  CalendarDays,
  Ban,
  CalendarPlus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Availability, AvailabilityException } from "@/integrations/supabase/types";

/* ============================================================
   Constantes
   ============================================================ */

const DAYS = [
  { label: "Domingo",         short: "Dom", value: 0 },
  { label: "Segunda-feira",   short: "Seg", value: 1 },
  { label: "Terça-feira",     short: "Ter", value: 2 },
  { label: "Quarta-feira",    short: "Qua", value: 3 },
  { label: "Quinta-feira",    short: "Qui", value: 4 },
  { label: "Sexta-feira",     short: "Sex", value: 5 },
  { label: "Sábado",          short: "Sáb", value: 6 },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

/* ============================================================
   Modal genérico
   ============================================================ */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border rounded-xl shadow-warm-lg w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-bold text-foreground">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   AvailabilityManager
   ============================================================ */

export default function AvailabilityManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estado do modal de bloco
  const [addingBlock, setAddingBlock] = useState<{ day: number; label: string } | null>(null);
  const [blockStart, setBlockStart] = useState("08:00");
  const [blockEnd, setBlockEnd] = useState("12:00");

  // Estado do modal de exceção
  const [addingException, setAddingException] = useState(false);
  const [excDate, setExcDate] = useState("");
  const [excType, setExcType] = useState<"block" | "extra">("block");
  const [excStart, setExcStart] = useState("08:00");
  const [excEnd, setExcEnd] = useState("18:00");

  /* ---- Queries ---- */

  const { data: availability = [], isLoading: loadingAvail } = useQuery({
    queryKey: ["availability", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", user!.id)
        .order("day_of_week")
        .order("start_time");
      if (error) throw error;
      return data as Availability[];
    },
    enabled: !!user?.id,
  });

  const { data: exceptions = [], isLoading: loadingExc } = useQuery({
    queryKey: ["availability_exceptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_exceptions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date");
      if (error) throw error;
      return data as AvailabilityException[];
    },
    enabled: !!user?.id,
  });

  /* ---- Mutations ---- */

  const { mutateAsync: addBlock, isPending: addingBlockPending } = useMutation({
    mutationFn: async ({
      day,
      start,
      end,
    }: {
      day: number;
      start: string;
      end: string;
    }) => {
      // Verifica se há conflito com blocos existentes no mesmo dia
      const dayBlocks = availability.filter((a) => a.day_of_week === day);
      const hasConflict = dayBlocks.some((b) => {
        const bStart = b.start_time.slice(0, 5);
        const bEnd = b.end_time.slice(0, 5);
        return start < bEnd && end > bStart;
      });

      if (hasConflict) {
        throw new Error("Este horário conflita com um bloco existente neste dia.");
      }

      const { error } = await supabase.from("availability").insert({
        user_id: user!.id,
        day_of_week: day,
        start_time: start,
        end_time: end,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Bloco de horário adicionado!");
      setAddingBlock(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: toggleBlock } = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("availability")
        .update({ is_active })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: deleteBlock } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Bloco removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: saveException, isPending: savingExc } = useMutation({
    mutationFn: async () => {
      if (!excDate) throw new Error("Selecione uma data");
      const { error } = await supabase.from("availability_exceptions").upsert(
        {
          user_id: user!.id,
          date: excDate,
          is_blocked: excType === "block",
          start_time: excType === "extra" ? excStart : null,
          end_time: excType === "extra" ? excEnd : null,
        },
        { onConflict: "user_id,date" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability_exceptions"] });
      toast.success("Exceção salva!");
      setAddingException(false);
      setExcDate("");
      setExcType("block");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: deleteException } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("availability_exceptions")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability_exceptions"] });
      toast.success("Exceção removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ---- Helpers ---- */

  function getBlocksForDay(day: number) {
    return availability
      .filter((a) => a.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  const selectClass =
    "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all";
  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all";

  /* ---- Render ---- */

  return (
    <div className="space-y-8">

      {/* ---- Agenda semanal ---- */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Horários semanais</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Adicione quantos blocos quiser por dia — ideal para pausas de almoço ou turnos diferentes.
        </p>

        {loadingAvail ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 shimmer rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {DAYS.map((day, i) => {
              const blocks = getBlocksForDay(day.value);

              return (
                <motion.div
                  key={day.value}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Cabeçalho do dia */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                        blocks.length > 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {day.short}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{day.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {blocks.length === 0
                            ? "Indisponível"
                            : `${blocks.length} bloco${blocks.length > 1 ? "s" : ""} de atendimento`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setBlockStart("08:00");
                        setBlockEnd("12:00");
                        setAddingBlock({ day: day.value, label: day.label });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 text-primary text-xs font-medium transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar bloco
                    </button>
                  </div>

                  {/* Blocos do dia */}
                  {blocks.length > 0 && (
                    <div className="divide-y divide-border">
                      <AnimatePresence>
                        {blocks.map((block, bi) => (
                          <motion.div
                            key={block.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 transition-opacity",
                              !block.is_active && "opacity-50"
                            )}
                          >
                            {/* Indicador de bloco */}
                            <div className={cn(
                              "w-1.5 h-8 rounded-full flex-shrink-0",
                              block.is_active ? "bg-primary" : "bg-muted-foreground/30"
                            )} />

                            <div className="flex-1">
                              <p className={cn(
                                "text-sm font-medium",
                                block.is_active ? "text-foreground" : "text-muted-foreground line-through"
                              )}>
                                {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Bloco {bi + 1}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  toggleBlock({ id: block.id, is_active: !block.is_active })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                title={block.is_active ? "Desativar" : "Ativar"}
                              >
                                {block.is_active ? (
                                  <ToggleRight className="w-5 h-5 text-primary" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                                )}
                              </button>
                              <button
                                onClick={() => deleteBlock(block.id)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                title="Remover bloco"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Exceções ---- */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Exceções e bloqueios</h3>
          </div>
          <button
            onClick={() => setAddingException(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Bloqueie dias específicos (feriados, folgas) ou adicione horários extras pontuais.
        </p>

        {loadingExc ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 shimmer rounded-xl" />
            ))}
          </div>
        ) : exceptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-xl">
            <CalendarPlus className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma exceção cadastrada.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {exceptions.map((exc, i) => (
                <motion.div
                  key={exc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    exc.is_blocked ? "bg-destructive/10" : "bg-green-50"
                  )}>
                    {exc.is_blocked
                      ? <Ban className="w-4 h-4 text-destructive" />
                      : <Plus className="w-4 h-4 text-green-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(exc.date + "T00:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exc.is_blocked
                        ? "Dia bloqueado"
                        : `Horário extra: ${exc.start_time?.slice(0, 5)} – ${exc.end_time?.slice(0, 5)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteException(exc.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal: adicionar bloco de horário */}
      <AnimatePresence>
        {addingBlock && (
          <Modal
            title={`Novo bloco — ${addingBlock.label}`}
            onClose={() => setAddingBlock(null)}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adicione um bloco de atendimento. Você pode ter vários blocos no mesmo dia — ex: manhã e tarde separados pelo almoço.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Início
                  </label>
                  <select
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Fim
                  </label>
                  <select
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {blockEnd <= blockStart && (
                <p className="text-sm text-destructive">
                  O horário de fim deve ser maior que o início.
                </p>
              )}

              {/* Preview dos blocos já existentes no dia */}
              {getBlocksForDay(addingBlock.day).length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Blocos existentes neste dia:
                  </p>
                  <div className="space-y-1">
                    {getBlocksForDay(addingBlock.day).map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-xs text-foreground">
                          {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAddingBlock(null)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={addingBlockPending || blockEnd <= blockStart}
                  onClick={() =>
                    addBlock({ day: addingBlock.day, start: blockStart, end: blockEnd })
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addingBlockPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Adicionar bloco
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal: adicionar exceção */}
      <AnimatePresence>
        {addingException && (
          <Modal title="Nova exceção" onClose={() => setAddingException(false)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Data
                </label>
                <input
                  type="date"
                  value={excDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExcDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExcType("block")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                      excType === "block"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-border text-muted-foreground hover:border-destructive/40"
                    )}
                  >
                    <Ban className="w-4 h-4" />
                    Bloquear dia
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcType("extra")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                      excType === "extra"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-border text-muted-foreground hover:border-green-400"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Horário extra
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {excType === "extra" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Início
                      </label>
                      <select
                        value={excStart}
                        onChange={(e) => setExcStart(e.target.value)}
                        className={selectClass}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Fim
                      </label>
                      <select
                        value={excEnd}
                        onChange={(e) => setExcEnd(e.target.value)}
                        className={selectClass}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setAddingException(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={savingExc || !excDate}
                  onClick={() => saveException()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {savingExc && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
