import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home, Plus, Settings, User, Users } from "lucide-react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import Index from "./pages/Index";
import ChatPage from "./pages/Chat";
import ProjectDetailPage from "./pages/projects/[slug]";

const queryClient = new QueryClient();

export const navItems = [
  {
    label: "Home",
    href: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    label: "Chat",
    href: "/chat",
    icon: <User className="h-4 w-4" />,
  },
  {
    label: "New Project",
    href: "/new-project",
    icon: <Plus className="h-4 w-4" />,
  },
  {
    label: "Team",
    href: "/team",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <ChatProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:conversationId" element={<ChatPage />} />
                <Route path="/projects/:slug" element={<ProjectDetailPage />} />
              </Routes>
            </Router>
          </ChatProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;