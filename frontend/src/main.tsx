import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import { setupWorker } from "msw/browser";
// import { handlers } from "@/api/mock";
import App from "./App";
import "./styles.css";

// await setupWorker(...handlers).start();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
