import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Conectando ao Google Calendar...");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");

      if (error) {
        setStatus("error");
        setMessage("Acesso negado pelo Google. Tente novamente.");
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Parâmetros inválidos. Tente novamente.");
        return;
      }

      // Valida o nonce para prevenir CSRF
      const savedNonce = sessionStorage.getItem("oauth_state_nonce");
      const savedUserId = sessionStorage.getItem("oauth_user_id");
      sessionStorage.removeItem("oauth_state_nonce");
      sessionStorage.removeItem("oauth_user_id");

      if (!savedNonce || state !== savedNonce || !savedUserId) {
        setStatus("error");
        setMessage("Sessão inválida. Tente conectar novamente.");
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const resp = await fetch(
          `${supabaseUrl}/functions/v1/google-calendar-integration`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
              "apikey": supabaseKey,
            },
            body: JSON.stringify({
              userId: savedUserId,
              action: "exchange_code",
              code,
              redirectUri: `${window.location.origin}/auth/callback/google`,
            }),
          }
        );

        const data = await resp.json();

        if (!resp.ok || data?.error) {
          throw new Error(data?.error || `Erro ${resp.status}`);
        }

        setStatus("success");
        setMessage("Google Calendar conectado com sucesso!");
        setTimeout(() => navigate("/"), 2000);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        setStatus("error");
        setMessage(msg);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-foreground font-medium">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground font-semibold text-lg mb-2">Conectado!</p>
            <p className="text-muted-foreground text-sm">{message}</p>
            <p className="text-muted-foreground/60 text-xs mt-2">Redirecionando...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-foreground font-semibold text-lg mb-2">Erro ao conectar</p>
            <p className="text-muted-foreground text-sm mb-6">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
            >
              Voltar ao perfil
            </button>
          </>
        )}
      </div>
    </div>
  );
}