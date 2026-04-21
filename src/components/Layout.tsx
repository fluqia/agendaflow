import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Menu, Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useProfile } from "@/hooks/useProfile";

interface LayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  title?: string;
}

export default function Layout({
  children,
  activeSection,
  onSectionChange,
  title,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useProfile();

  const sectionTitles: Record<string, string> = {
    dashboard: "Dashboard",
    agendamentos: "Agendamentos",
    servicos: "Serviços",
    disponibilidade: "Disponibilidade",
    receitas: "Receitas",
    restricoes: "Restrições",
    perfil: "Perfil",
  };

  const pageTitle = title || sectionTitles[activeSection] || "Agendfy";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile + desktop */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-border bg-background flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Botão menu mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">
                {pageTitle}
              </h1>
              {profile?.business_name && (
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {profile.business_name}
                </p>
              )}
            </div>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm font-semibold">
                {(profile?.name || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Conteúdo com scroll */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-4 lg:p-8 max-w-7xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
