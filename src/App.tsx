import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "./hooks/useAuth";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { TeamPage } from "./pages/TeamPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SearchPage } from "./pages/SearchPage";
import { HelpPage } from "./pages/HelpPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import { GoogleCalendarPage } from "./pages/integrations/GoogleCalendarPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/project/:id" element={<ProjectDetailPage />} />
            <Route path="/create-project" element={<CreateProjectPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route
              path="/integrations/openai"
              element={<OpenAiIntegrationPage />}
            />
            <Route
              path="/integrations/google-calendar"
              element={<GoogleCalendarPage />}
            />
            <Route
              path="/settings/navigation"
              element={<NavigationSettingsPage />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;