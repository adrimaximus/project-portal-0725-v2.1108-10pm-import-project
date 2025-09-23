import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home, Settings, Bot, MessageSquare, Users, Briefcase, LayoutDashboard, FileText, LifeBuoy, LogOut, User, Bell, Search, ChevronDown, Menu, X, Sun, Moon } from "lucide-react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Index from "./pages/Index.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import NavigationSettingsPage from "./pages/NavigationSettingsPage.tsx";
import CustomPage from "./pages/CustomPage.tsx";
import MultiEmbedPage from "./pages/MultiEmbedPage.tsx";
import MultiEmbedItemPage from "./pages/MultiEmbedItemPage.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/settings/navigation" element={<ProtectedRoute><NavigationSettingsPage /></ProtectedRoute>} />
              <Route path="/custom/:pageId" element={<ProtectedRoute><CustomPage /></ProtectedRoute>} />
              <Route path="/custom-page/:navItemId" element={<ProtectedRoute><MultiEmbedPage /></ProtectedRoute>} />
              <Route path="/custom-page/:navItemId/:itemId" element={<ProtectedRoute><MultiEmbedItemPage /></ProtectedRoute>} />
            </Routes>
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;