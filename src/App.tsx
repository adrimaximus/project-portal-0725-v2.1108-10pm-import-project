import { SupabaseAuthProvider } from "./integrations/supabase/auth/SupabaseAuthProvider";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProjectDetail from "./pages/ProjectDetail";
import Index from "./pages/Index";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <SupabaseAuthProvider>
      <Toaster position="bottom-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
        </Routes>
      </BrowserRouter>
    </SupabaseAuthProvider>
  );
}

export default App;