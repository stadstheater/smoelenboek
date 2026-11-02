import { ViewTransition, type ReactNode } from "react";

/**
 * Overgang tussen pagina's: de oude pagina gaat snel weg, de nieuwe komt rustig omhoog.
 * Staat in elke page.tsx en niet in de layout: een layout blijft staan, dus daar zou niets bewegen.
 * De zijbalk en de topbalk zitten in de layout en bewegen dus niet mee.
 */
export function Pagina({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="pagina-in" exit="pagina-uit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
