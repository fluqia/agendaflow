import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarX } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background bg-texture flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full text-center"
      >
        {/* Ícone decorativo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CalendarX className="w-12 h-12 text-primary" />
            </div>
            {/* Decoração âmbar */}
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent opacity-80" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-primary/30" />
          </div>
        </motion.div>

        {/* Código de erro */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-semibold text-primary tracking-widest uppercase mb-3"
        >
          Erro 404
        </motion.p>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="font-display text-4xl font-bold text-foreground mb-4"
        >
          Página não encontrada
        </motion.h1>

        {/* Descrição */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-muted-foreground text-lg leading-relaxed mb-10"
        >
          A página que você está procurando não existe ou foi movida.
          Verifique o endereço ou volte ao início.
        </motion.p>

        {/* Ações */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors duration-200"
          >
            Ir ao início
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-12 text-xs text-muted-foreground"
        >
          © {new Date().getFullYear()} Agendfy · Todos os direitos reservados
        </motion.p>
      </motion.div>
    </div>
  );
}
