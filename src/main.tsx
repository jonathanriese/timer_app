import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import TimerPage from "./pages/timer"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TimerPage />
  </StrictMode>
)
