import { THEMA_SCRIPT } from "./thema";

/** Zet in <head> van de root-layout, zodat het juiste thema er vanaf de eerste pixel staat */
export function ThemaScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEMA_SCRIPT }} />;
}
