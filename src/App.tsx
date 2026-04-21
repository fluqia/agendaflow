import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/hooks/useAuth";

const Auth = lazy(() => import("@/pages/Auth"));
const Index = lazy(() => import("@/pages/Index"));
const PublicBooking = lazy(() => import("@/pages/PublicBooking"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-md bg-primary animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Carregando…
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/*
        AuthProvider envolve TUDO — assim qualquer componente
        pode usar useAuth() sem precisar de props drilling.
      */}
      <AuthProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { fontFamily: "DM Sans, sans-serif" },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/book/:slug" element={<PublicBooking />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
