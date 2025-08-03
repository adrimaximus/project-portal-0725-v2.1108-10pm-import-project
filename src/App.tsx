import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Route, Routes } from "react-router-dom"
import DashboardPage from "./pages/DashboardPage"
import ProjectsPage from "./pages/ProjectsPage"
import ProjectDetailPage from "./pages/ProjectDetailPage"
import GoalsPage from "./pages/GoalsPage"
import GoalDetailPage from "./pages/GoalDetailPage"
import GoalEditPage from "./pages/GoalEditPage"
import SettingsPage from "./pages/SettingsPage"
import TeamPage from "./pages/TeamPage"
import SearchPage from "./pages/SearchPage"
import IntegrationsDirectoryPage from "./pages/integrations/IntegrationsDirectoryPage"
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage"

function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:id" element={<GoalDetailPage />} />
        <Route path="/goals/:id/edit" element={<GoalEditPage />} />
        <Route path="/goals/new" element={<GoalEditPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/integrations" element={<IntegrationsDirectoryPage />} />
        <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
      <Toaster />
    </TooltipProvider>
  )
}

export default App