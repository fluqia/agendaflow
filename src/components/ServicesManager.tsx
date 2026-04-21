import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Scissors,
  Clock,
  DollarSign,
  Wifi,
  MapPin,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Service, ServiceInsert, ServiceUpdate } from "@/integrations/supabase/types";

/* ============================================================
   Formulário de serviço (criar / editar)
   ============================================================ */

interface ServiceFormProps {
  service?: Service;
  onSave: (data: ServiceInsert | ServiceUpdate) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function ServiceForm({ service, onSave, onCancel, isSaving }: ServiceFormProps) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [duration, setDuration] = useState(String(service?.duration ?? 60));
  const [price, setPrice] = useState(String(service?.price ?? ""));
  const [type, setType] = useState<"online" | "presencial">(service?.type ?? "presencial");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Digite o nome do serviço");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      toast.error("Duração inválida");
      return;
    }
    if (price === "" || Number(price) < 0) {
      toast.error("Preço inválido");
      return;
    }

    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      duration: Number(duration),
      price: Number(price),
      type,
    });
  }

  const durationOptions = [15, 30, 45, 60, 90, 120];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="card-warm p-6 mb-4"
    >
      <h3 className="font-display text-lg font-bold text-foreground mb-5">
        {service ? "Editar serviço" : "Novo serviço"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nome do serviço *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Corte de cabelo, Consulta, Massagem..."
            maxLength={100}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que está incluído neste serviço..."
            rows={2}
            maxLength={500}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Duração */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Duração *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {durationOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDuration(String(opt))}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    duration === String(opt)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {formatDuration(opt)}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Minutos"
              min={5}
              max={480}
              className="w-full mt-2 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Preço (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                min={0}
                step={0.01}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Modalidade *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("presencial")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium border transition-all",
                  type === "presencial"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                Presencial
              </button>
              <button
                type="button"
                onClick={() => setType("online")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium border transition-all",
                  type === "online"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <Wifi className="w-3.5 h-3.5" />
                Online
              </button>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {service ? "Salvar alterações" : "Criar serviço"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-muted text-foreground font-medium text-sm transition-all"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* ============================================================
   Card de serviço
   ============================================================ */

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onToggleActive: (service: Service) => void;
  onDelete: (service: Service) => void;
  isUpdating: boolean;
}

function ServiceCard({ service, onEdit, onToggleActive, onDelete, isUpdating }: ServiceCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        "card-warm p-5 transition-all duration-200",
        !service.is_active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Nome + badge tipo */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-foreground text-base truncate">
              {service.name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
                service.type === "online"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-green-50 text-green-700 border-green-200"
              )}
            >
              {service.type === "online" ? (
                <Wifi className="w-2.5 h-2.5" />
              ) : (
                <MapPin className="w-2.5 h-2.5" />
              )}
              {service.type === "online" ? "Online" : "Presencial"}
            </span>
            {!service.is_active && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                Inativo
              </span>
            )}
          </div>

          {/* Descrição */}
          {service.description && (
            <p className="text-sm text-muted-foreground mb-3 truncate-2">
              {service.description}
            </p>
          )}

          {/* Duração + preço */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(service.duration)}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              {formatCurrency(Number(service.price))}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Toggle ativo/inativo */}
          <button
            onClick={() => onToggleActive(service)}
            disabled={isUpdating}
            title={service.is_active ? "Desativar" : "Ativar"}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {service.is_active ? (
              <ToggleRight className="w-5 h-5 text-primary" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>

          {/* Editar */}
          <button
            onClick={() => onEdit(service)}
            title="Editar"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Deletar */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(service)}
                disabled={isUpdating}
                className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium transition-colors hover:bg-muted"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Excluir"
              className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   ServicesManager principal
   ============================================================ */

export default function ServicesManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  /* ---- Queries ---- */

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", user?.id],
    queryFn: async (): Promise<Service[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  /* ---- Mutations ---- */

  const { mutateAsync: createService, isPending: isCreating } = useMutation({
    mutationFn: async (data: Omit<ServiceInsert, "user_id">) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("services")
        .insert({ ...data, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", user?.id] });
      toast.success("Serviço criado com sucesso!");
      setShowForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: updateService, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ServiceUpdate }) => {
      const { error } = await supabase
        .from("services")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", user?.id] });
      toast.success("Serviço atualizado!");
      setEditingService(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: deleteService, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", user?.id] });
      toast.success("Serviço excluído.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ---- Handlers ---- */

  async function handleSaveNew(data: ServiceInsert | ServiceUpdate) {
    await createService(data as Omit<ServiceInsert, "user_id">);
  }

  async function handleSaveEdit(data: ServiceInsert | ServiceUpdate) {
    if (!editingService) return;
    await updateService({ id: editingService.id, data });
  }

  async function handleToggleActive(service: Service) {
    await updateService({
      id: service.id,
      data: { is_active: !service.is_active },
    });
  }

  async function handleDelete(service: Service) {
    await deleteService(service.id);
  }

  const activeServices = services?.filter((s) => s.is_active) ?? [];
  const inactiveServices = services?.filter((s) => !s.is_active) ?? [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {services?.length ?? 0} serviço{services?.length !== 1 ? "s" : ""} cadastrado{services?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo serviço
        </button>
      </div>

      {/* Formulário de criação */}
      <AnimatePresence>
        {showForm && !editingService && (
          <ServiceForm
            onSave={handleSaveNew}
            onCancel={() => setShowForm(false)}
            isSaving={isCreating}
          />
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 shimmer rounded-xl" />
          ))}
        </div>
      )}

      {/* Lista de serviços */}
      {!isLoading && (
        <>
          {services?.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Scissors className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Nenhum serviço cadastrado
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs">
                Adicione seus serviços para que os clientes possam fazer agendamentos.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar primeiro serviço
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Serviços ativos */}
              {activeServices.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Ativos ({activeServices.length})
                  </p>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {activeServices.map((service) => (
                        editingService?.id === service.id ? (
                          <ServiceForm
                            key={service.id}
                            service={service}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingService(null)}
                            isSaving={isUpdating}
                          />
                        ) : (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onEdit={(s) => { setEditingService(s); setShowForm(false); }}
                            onToggleActive={handleToggleActive}
                            onDelete={handleDelete}
                            isUpdating={isUpdating || isDeleting}
                          />
                        )
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Serviços inativos */}
              {inactiveServices.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Inativos ({inactiveServices.length})
                  </p>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {inactiveServices.map((service) => (
                        editingService?.id === service.id ? (
                          <ServiceForm
                            key={service.id}
                            service={service}
                            onSave={handleSaveEdit}
                            onCancel={() => setEditingService(null)}
                            isSaving={isUpdating}
                          />
                        ) : (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onEdit={(s) => { setEditingService(s); setShowForm(false); }}
                            onToggleActive={handleToggleActive}
                            onDelete={handleDelete}
                            isUpdating={isUpdating || isDeleting}
                          />
                        )
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
