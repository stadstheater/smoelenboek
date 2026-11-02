"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { loginActie, type FormStatus } from "@/app/actions";

export function LoginFormulier() {
  const [status, actie, bezig] = useActionState<FormStatus, FormData>(loginActie, {});

  return (
    <form action={actie} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-inkt-2">Wachtwoord</span>
        <input
          key={status.fout ? "fout" : "leeg"}
          type="password"
          name="wachtwoord"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={!!status.fout}
          className={`veld h-11 ${status.fout ? "animate-[schud_300ms] border-rood" : ""}`}
        />
      </label>
      {status.fout && (
        <p role="alert" className="animate-fade text-[13px] font-semibold text-rood">
          {status.fout}
        </p>
      )}
      <button type="submit" disabled={bezig} className="knop knop-vol h-11 w-full">
        {bezig ? "Controleren" : "Inloggen"} {!bezig && <ArrowRight size={16} aria-hidden />}
      </button>
      <p className="text-[12px] text-inkt-4">Het wachtwoord krijg je van het marketingteam. Het is hetzelfde voor iedereen.</p>
    </form>
  );
}
