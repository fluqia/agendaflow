import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  Building2,
  FileText,
  MapPin,
  Phone,
  Link,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { slugify } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ProfileSettings() {
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  // Preenche o formulário quando o perfil carrega
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

  // Gera slug automático a partir do nome do negócio
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
    <div className="max-w-2xl space-y-8">

      {/* Link público — destaque no topo */}
      {slug && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
              Sua página pública
            </p>
            <p className="text-sm text-foreground font-medium truncate">
              {window.location.origin}/book/{slug}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={copySlug}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
              title="Copiar link"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`/book/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
              title="Abrir página"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Dados pessoais */}
        <div className="card-warm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Dados pessoais</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nome completo <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Telefone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className={cn(inputClass, "pl-10")}
              />
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
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nome do negócio
            </label>
            <input
              value={businessName}
              onChange={(e) => handleBusinessNameChange(e.target.value)}
              placeholder="Ex: Clínica da Ana, Studio João..."
              className={inputClass}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Aparece no topo da sua página pública de agendamento.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Descrição
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte um pouco sobre seus serviços e diferenciais..."
                rows={3}
                className={cn(inputClass, "pl-10 resize-none")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Endereço
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade"
                className={cn(inputClass, "pl-10")}
              />
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
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Seu link de agendamento
            </label>
            <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-all">
              <span className="px-3 py-3 text-sm text-muted-foreground bg-muted border-r border-input whitespace-nowrap flex-shrink-0">
                /book/
              </span>
              <input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="seu-nome"
                className="flex-1 px-3 py-3 text-sm text-foreground bg-transparent focus:outline-none"
              />
            </div>
            {slug && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Ficará disponível em:{" "}
                <span className="text-primary font-medium">
                  {window.location.origin}/book/{slug}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Use apenas letras minúsculas, números e hífens. Mínimo 3 caracteres.
            </p>
          </div>
        </div>

        {/* Botão salvar */}
        <button
          type="submit"
          disabled={isUpdating}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          Salvar perfil
        </button>
      </form>
    </div>
  );
}
