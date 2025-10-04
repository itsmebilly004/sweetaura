import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- TEMPORARY DIAGNOSTIC LOGS ---
// This will help us see what Vercel is sending to your application.
console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY:", import.meta.env.VITE_SUPABASE_ANON_KEY);
// ------------------------------------

createRoot(document.getElementById("root")!).render(<App />);