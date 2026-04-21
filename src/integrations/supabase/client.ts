import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Variáveis de ambiente injetadas pelo Vite.
 * Defina em .env.local (nunca commite esse arquivo).
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. " +
    "Crie o arquivo .env.local com base em .env.local.example."
  );
}

/**
 * Cliente Supabase com tipagem completa do banco.
 * Use este cliente em todos os hooks e componentes — NUNCA crie outro.
 * 
 * SEGURANÇA: Este cliente usa a anon key e respeita RLS.
 * Nunca passe a service role key para o frontend.
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
  global: {
    headers: {
      "x-app-name": "agendfy-web",
    },
  },
});

export type { Database };
