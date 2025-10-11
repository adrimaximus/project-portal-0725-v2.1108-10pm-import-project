import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import PortalLayout from "./components/PortalLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Chat from "./pages/Chat";
import Goals from "./pages/Goals";
import People from "./pages/People";
import Settings from "./pages/Settings";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectDetails from "./pages/ProjectDetails";
import KnowledgeBase from "./pages/KnowledgeBase";
import RequestPage from "./pages/RequestPage";
import MoodTracker from "./pages/MoodTracker";
import BillingPage from "./pages/BillingPage";
import CustomPageViewer from "./pages/CustomPageViewer";
import MultiPageViewer from "./pages/MultiPageViewer";
import TestEditorPage from "./pages/TestEditorPage";
import { ChatProvider } from "./contexts/ChatContext";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/:slug" element={<ProjectDetails />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/chat/:conversationId" element={<Chat />} />
                      <Route path="/goals" element={<Goals />} />
                      <Route path="/people" element={<People />} />
                      <Route path="/settings/*" element={<Settings />} />
                      <Route path="/knowledge-base" element={<KnowledgeBase />} />
                      <Route path="/request" element={<RequestPage />} />
                      <Route path="/mood-tracker" element={<MoodTracker />} />
                      <Route path="/billing" element={<BillingPage />} />
                      <Route path="/custom/:slug" element={<CustomPageViewer />} />
                      <Route path="/multipage/:slug" element={<MultiPageViewer />} />
                      <Route path="/test-editor" element={<TestEditorPage />} />
                      <Route index element={<Dashboard />} />
                    </Routes>
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <Toaster />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;