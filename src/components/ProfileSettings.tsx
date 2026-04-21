import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Building2, FileText, MapPin, Phone,
  Link, Loader2, CheckCircle2, ExternalLink,
  Copy, Calendar, Unlink,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ProfileSettings() {
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBusinessName(profile.business_name || "");
      setDescription(profile.description || "");
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setSlug(profile.custom_url_slug || "");
    }
  }, [profile]);

  /* ---- Google Calendar ---- */
  const { data: hasCalendar, isLoading: checkingCalendar } = useQuery({
    queryKey: ["google-calendar-connected", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_google_calendar_connected", {
        p_user_id: user!.id,
      });
      return !!data;
    },
    enabled: !!user?.id,
  });

  const { mutateAsync: disconnectCalendar, isPending: disconnecting } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("disconnect_google_calendar", {
        p_user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-calendar-connected"] });
      toast.success("Google Calendar desconectado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function connectGoogleCalendar() {
    const clientId = import.meta.env.VITE_SUPABASE_URL
      ? "901663362876-9irlhm4orh44qpc8q5dmod2rpa2jv9ce.apps.googleusercontent.com"
      : "";

    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const scope = "https://www.googleapis.com/auth/calendar.events";
    const state = user!.id;

    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    window.location.href = url;
  }

  /* ---- Perfil ---- */
  function handleBusinessNameChange(value: string) {
    setBusinessName(value);
    if (!slugEdited && !profile?.custom_url_slug) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlug(slugify(value));
    setSlugEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nome é obrigatório");
    if (slug && slug.length < 3) return toast.error("URL deve ter pelo menos 3 caracteres");

    await updateProfile({
      name: name.trim(),
      business_name: businessName.trim() || null,
      description: description.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      custom_url_slug: slug.trim() || null,
    });
  }

  function copySlug() {
    if (!slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
    toast.success("Link copiado!");
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Link público */}
      {slug && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">Sua página pública</p>
            <p className="text-sm text-foreground font-medium truncate">{window.location.origin}/book/{slug}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={copySlug} className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary" title="Copiar link">
              <Copy className="w-4 h-4" />
            </button>
            <a href={`/book/${slug}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary" title="Abrir página">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      )}

      {/* Google Calendar */}
      <div className="card-warm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Google Calendar</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Conecte seu Google Calendar para criar eventos automaticamente quando confirmar agendamentos, com link do Google Meet incluso.
        </p>

        {checkingCalendar ? (
          <div className="h-10 w-48 shimmer rounded-lg" />
        ) : hasCalendar ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Google Calendar conectado
            </div>
            <button
              onClick={() => disconnectCalendar()}
              disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
              Desconectar
            </button>
          </div>
        ) : (
          <button
            onClick={connectGoogleCalendar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Conectar Google Calendar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dados pessoais */}
        <div className="card-warm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Dados pessoais</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo <span className="text-destructive">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={cn(inputClass, "pl-10")} />
            </div>
          </div>
        </div>

        {/* Dados do negócio */}
        <div className="card-warm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Seu negócio</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome do negócio</label>
            <input value={businessName} onChange={(e) => handleBusinessNameChange(e.target.value)} placeholder="Ex: Clínica da Ana, Studio João..." className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Aparece no topo da sua página pública de agendamento.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte um pouco sobre seus serviços..." rows={3} className={cn(inputClass, "pl-10 resize-none")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Endereço</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" className={cn(inputClass, "pl-10")} />
            </div>
          </div>
        </div>

        {/* URL personalizada */}
        <div className="card-warm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Link className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">URL personalizada</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Seu link de agendamento</label>
            <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-all">
              <span className="px-3 py-3 text-sm text-muted-foreground bg-muted border-r border-input whitespace-nowrap flex-shrink-0">/book/</span>
              <input value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="seu-nome" className="flex-1 px-3 py-3 text-sm text-foreground bg-transparent focus:outline-none" />
            </div>
            {slug && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                <span className="text-primary font-medium">{window.location.origin}/book/{slug}</span>
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          Salvar perfil
        </button>
      </form>
    </div>
  );
}
