import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/* ============================================================
   Tipos
   ============================================================ */

interface AuthContextValue {
  /** Sessão atual do Supabase (null = não autenticado) */
  session: Session | null;
  /** Usuário atual (null = não autenticado) */
  user: User | null;
  /** true enquanto verifica a sessão inicial */
  loading: boolean;
  /** Login com email e senha */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Cadastro com email e senha */
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  /** Login com Google OAuth */
  signInWithGoogle: () => Promise<void>;
  /** Logout */
  signOut: () => Promise<void>;
}

/* ============================================================
   Contexto
   ============================================================ */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ============================================================
   Provider
   ============================================================ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de sessão (login, logout, refresh de token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* ---- Ações ---- */

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    name: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        // Redireciona após confirmação de email
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: "email profile",
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   Hook
   ============================================================ */

/**
 * Use em qualquer componente para acessar autenticação.
 * Exemplo:
 *   const { user, signOut } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
