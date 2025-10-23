import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountPage from "./pages/Account";
import DashboardPage from "./pages/Dashboard";
import IndexPage from "./pages/Index";
import LoginPage from "./pages/Login";
import ProjectPage from "./pages/Project";
import ProjectsPage from "./pages/Projects";
import SettingsPage from "./pages/Settings";
import GeneralSettings from "./pages/settings/General";
import ProfileSettings from "./pages/settings/Profile";
import NotificationsSettings from "./pages/settings/Notifications";
import SystemNotificationsAdmin from "./pages/settings/SystemNotificationsAdmin";

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
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<IndexPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:slug" element={<ProjectPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="settings" element={<SettingsPage />}>
                  <Route index element={<GeneralSettings />} />
                  <Route path="profile" element={<ProfileSettings />} />
                  <Route path="notifications" element={<NotificationsSettings />} />
                  <Route path="notifications/system" element={<SystemNotificationsAdmin />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;