import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { GoalsProvider } from "./context/GoalsContext.tsx";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <GoalsProvider>
      <App />
    </GoalsProvider>
  </BrowserRouter>
);