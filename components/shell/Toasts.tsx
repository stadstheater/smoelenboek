"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

type Toast = { id: number; tekst: string; soort: "ok" | "fout" };
type ToastFn = (tekst: string, soort?: Toast["soort"]) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toon = useCallback<ToastFn>((tekst, soort = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((oud) => [...oud.slice(-3), { id, tekst, soort }]);
    setTimeout(() => setToasts((oud) => oud.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <ToastContext value={toon}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex max-w-sm animate-toast items-center gap-3 rounded-xl border border-sluier/10 bg-vlak-diep/95 py-2.5 pr-2 pl-3.5 text-[13px] font-medium shadow-2xl shadow-schaduw/40 backdrop-blur"
          >
            {t.soort === "ok" ? (
              <CircleCheck size={17} className="shrink-0 text-groen" aria-hidden />
            ) : (
              <CircleAlert size={17} className="shrink-0 text-rood" aria-hidden />
            )}
            <span>{t.tekst}</span>
            <button
              type="button"
              onClick={() => setToasts((oud) => oud.filter((x) => x.id !== t.id))}
              className="rounded-md p-1 text-inkt-4 hover:bg-sluier/10 hover:text-inkt"
              aria-label="Melding sluiten"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
