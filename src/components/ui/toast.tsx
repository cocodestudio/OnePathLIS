"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const variantConfig: Record<ToastVariant, { icon: React.ElementType; iconWrap: string; bar: string }> = {
  success: { icon: CheckCircle2, iconWrap: "bg-primary/12 text-primary", bar: "bg-primary" },
  error: { icon: AlertCircle, iconWrap: "bg-destructive/12 text-destructive", bar: "bg-destructive" },
  info: { icon: Info, iconWrap: "bg-gold/15 text-gold", bar: "bg-gold" },
};

function ToastCard({ title, description, variant, onClose }: ToastItem & { onClose: () => void }) {
  const [shown, setShown] = React.useState(false);
  const { icon: Icon, iconWrap, bar } = variantConfig[variant];

  React.useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={`pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/95 backdrop-blur-md p-3.5 pr-9 shadow-overlay transition-all duration-300 ease-out ${
        shown ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
      }`}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} />
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={onClose}
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    const item: ToastItem = { id, title: input.title, description: input.description, variant: input.variant ?? "info" };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  const value = React.useMemo<ToastContextValue>(() => ({
    toast,
    success: (title, description) => toast({ title, description, variant: "success" }),
    error: (title, description) => toast({ title, description, variant: "error" }),
    info: (title, description) => toast({ title, description, variant: "info" }),
  }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[350px] max-w-[calc(100vw-2.5rem)] flex-col gap-2.5">
        {toasts.map((t) => (
          <ToastCard key={t.id} {...t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
