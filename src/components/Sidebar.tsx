import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, Scissors, Clock,
  TrendingUp, ShieldAlert, User, LogOut, X,
  Calendar, ChevronRight, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",       icon: LayoutDashboard, section: "dashboard" },
  { label: "Agendamentos",    icon: CalendarDays,    section: "agendamentos" },
  { label: "Serviços",        icon: Scissors,        section: "servicos" },
  { label: "Disponibilidade", icon: Clock,           section: "disponibilidade" },
  { label: "Receitas",        icon: TrendingUp,      section: "receitas" },
  { label: "Restrições",      icon: ShieldAlert,     section: "restricoes" },
  { label: "Perfil",          icon: User,            section: "perfil" },
] as const;

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeSection, onSectionChange, isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/auth");
    } catch {
      toast.error("Erro ao sair. Tente novamente.");
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Calendar className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white leading-none tracking-tight">
              AgendaFlow
            </p>
            <p className="text-[9px] text-white/20 leading-none mt-0.5 tracking-wide">
              by fluqia
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-white/40 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Perfil resumido */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            {profile?.profile_image_url ? (
              <img src={profile.profile_image_url} alt={profile.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span className="text-primary text-sm font-bold font-display">
                {(profile?.name || user?.email || "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {profile?.name || user?.email?.split("@")[0] || ""}
            </p>
            <p className="text-white/35 text-xs truncate">
              {profile?.business_name || user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeSection === item.section;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.section}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              onClick={() => { onSectionChange(item.section); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-sidebar-accent text-primary border-l-2 border-primary rounded-r-lg"
                  : "text-white/50 hover:text-white hover:bg-white/5 rounded-lg"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0 transition-colors",
                isActive ? "text-primary" : "text-white/35 group-hover:text-white/60"
              )} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-primary/50" />}
            </motion.button>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        {profile?.custom_url_slug && (
          <a
            href={`/book/${profile.custom_url_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-150"
          >
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">/book/{profile.custom_url_slug}</span>
          </a>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sair da conta</span>
        </button>
      </div>

    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex flex-col w-56 bg-sidebar-background border-r border-sidebar-border h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -224 }} animate={{ x: 0 }} exit={{ x: -224 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-56 bg-sidebar-background z-30 lg:hidden flex flex-col"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
