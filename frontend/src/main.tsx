import "@/util/seed";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import analytics from "react-ga4";
import App from "./App";

console.debug({ env: import.meta.env });

/** init google analytics */
if (import.meta.env.PROD) analytics.initialize("G-CS5J55JQF5");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
