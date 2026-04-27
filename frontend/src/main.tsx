import "@/util/seed";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import analytics from "react-ga4";
import { setupWorker } from "msw/browser";
import { handlers } from "@/api/mock";
import { url } from "@/util/url";
import App from "./App";

console.debug({ env: import.meta.env });

/** init google analytics */
if (import.meta.env.PROD) analytics.initialize("G-CS5J55JQF5");

/** whether to mock network requests with fake responses */
export const mock = url.searchParams.get("mock") === "true";

if (mock) await setupWorker(...handlers).start();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
