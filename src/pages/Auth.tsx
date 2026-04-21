import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/* ============================================================
   Tipos
   ============================================================ */

type Mode = "login" | "cadastro";

/* ============================================================
   Componente principal
   ============================================================ */

export default function Auth() {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Campos do formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ---- Handlers ---- */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        navigate("/");
      } else {
        if (name.trim().length < 2) {
          toast.error("Digite seu nome completo");
          return;
        }
        await signUpWithEmail(email, password, name);
        toast.success(
          "Cadastro realizado! Verifique seu email para confirmar a conta.",
          { duration: 6000 }
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";

      // Traduz as mensagens de erro do Supabase para PT-BR
      if (msg.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Confirme seu email antes de entrar");
      } else if (msg.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
        setMode("login");
      } else if (msg.includes("Password should be at least")) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // O redirect acontece automaticamente pelo OAuth
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao conectar com Google";
      toast.error(msg);
      setGoogleLoading(false);
    }
  }

  /* ---- Render ---- */

  return (
    <div className="min-h-screen bg-background flex">

      {/* ---- Painel esquerdo: decorativo ---- */}
      <div className="hidden lg:flex lg:w-1/2 bg-tinta relative overflow-hidden flex-col justify-between p-12">
        {/* Padrão geométrico de fundo */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(35 20% 97%) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Círculo decorativo âmbar */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent opacity-10" />
        <div className="absolute bottom-32 -left-16 w-64 h-64 rounded-full bg-primary opacity-15" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-white">Agendfy</span>
        </motion.div>

        {/* Tagline central */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative z-10"
        >
          <h1 className="font-display text-5xl font-bold text-white leading-tight mb-6">
            Seu negócio<br />
            <span className="text-accent">organizado</span>,<br />
            seus clientes<br />satisfeitos.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-sm">
            Gerencie agendamentos, disponibilidade e receitas em um só lugar.
          </p>
        </motion.div>

        {/* Depoimento / social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10"
        >
          <div className="border border-white/10 rounded-xl p-5 backdrop-blur-sm bg-white/5">
            <p className="text-white/80 text-sm leading-relaxed mb-3">
              "Reduzi o tempo gasto com agendamentos em mais de 70%. Meus clientes adoram a praticidade."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/40 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">AS</span>
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Ana Silva</p>
                <p className="text-white/50 text-xs">Nutricionista · São Paulo</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ---- Painel direito: formulário ---- */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Agendfy</span>
          </div>

          {/* Cabeçalho */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "login"
                ? "Entre na sua conta para continuar"
                : "Comece a organizar seus agendamentos hoje"}
            </p>
          </div>

          {/* Botão Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors duration-200 text-foreground font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              /* Ícone do Google em SVG inline */
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {mode === "login" ? "Entrar com Google" : "Cadastrar com Google"}
          </button>

          {/* Divisor */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "cadastro" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="João Silva"
                    required
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Senha
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => toast.info("Funcionalidade disponível em breve")}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "cadastro" ? "Mínimo 6 caracteres" : "••••••••"}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Botão submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Entrar" : "Criar conta"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternar modo */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("cadastro"); setPassword(""); }}
                  className="text-primary font-medium hover:underline"
                >
                  Cadastre-se grátis
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("login"); setPassword(""); }}
                  className="text-primary font-medium hover:underline"
                >
                  Fazer login
                </button>
              </>
            )}
          </p>

          {/* Termos */}
          {mode === "cadastro" && (
            <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
              Ao se cadastrar, você concorda com nossos{" "}
              <span className="text-primary">Termos de Uso</span> e{" "}
              <span className="text-primary">Política de Privacidade</span>.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
