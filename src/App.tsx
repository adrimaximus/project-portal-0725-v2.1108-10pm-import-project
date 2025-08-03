import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Routes, Navigate } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";

function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;