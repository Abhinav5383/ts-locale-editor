import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoot from "./index.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppRoot />
    </StrictMode>,
);
