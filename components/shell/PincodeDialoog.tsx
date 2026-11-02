"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, X } from "lucide-react";
import { pincodeActie, type FormStatus } from "@/app/actions";
import { useToast } from "@/components/shell/Toasts";

/** Venster dat om de pincode voor het beheer vraagt */
export function PincodeDialoog({ naar, onSluit }: { naar: string; onSluit: () => void }) {
  const dialoog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const toast = useToast();
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(pincodeActie, {});

  useEffect(() => {
    dialoog.current?.showModal();
  }, []);

  useEffect(() => {
    if (!status.ok) return;
    toast("Beheer is open");
    dialoog.current?.close();
    router.push(status.slug || "/beheer");
    router.refresh();
  }, [status, router, toast]);

  return (
    <dialog
      ref={dialoog}
      onClose={onSluit}
      onClick={(e) => e.target === e.currentTarget && dialoog.current?.close()}
      aria-labelledby="pincode-titel"
      className="paneel fixed inset-0 m-0 h-full w-full bg-transparent p-0 text-inkt"
    >
      <div className="flex h-full items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && dialoog.current?.close()}>
        <form action={actie} className="relative w-full max-w-sm animate-pop rounded-2xl border border-sluier/10 bg-vlak-diep p-6 shadow-2xl shadow-schaduw/50">
          <button type="button" onClick={() => dialoog.current?.close()} className="knop knop-ghost knop-icoon absolute top-3 right-3" aria-label="Sluiten">
            <X size={17} />
          </button>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sluier/[0.07] text-inkt-3">
            <KeyRound size={20} aria-hidden />
          </span>
          <h2 id="pincode-titel" className="mt-4 text-[18px] font-semibold">
            Beheer openen
          </h2>
          <p className="mt-1 mb-5 text-[13px] text-inkt-4">Vul de pincode in om medewerkers, afdelingen en de structuur te beheren.</p>
          <input type="hidden" name="naar" value={naar} />
          <input
            key={status.fout ?? "leeg"}
            name="pincode"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            required
            maxLength={12}
            aria-label="Pincode"
            aria-invalid={!!status.fout}
            className={`veld h-12 text-center font-display text-[22px] tracking-[0.4em] ${status.fout ? "animate-[schud_300ms] border-rood" : ""}`}
          />
          {status.fout && (
            <p role="alert" className="mt-3 animate-fade text-[13px] font-semibold text-rood">
              {status.fout}
            </p>
          )}
          <button type="submit" disabled={bezig} className="knop knop-vol mt-4 h-11 w-full">
            {bezig ? "Controleren" : "Openen"}
          </button>
        </form>
      </div>
    </dialog>
  );
}
