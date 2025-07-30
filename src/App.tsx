import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Index from "./pages/Index";
import RequestPage from "./pages/RequestPage";
import ChatPage from "./pages/ChatPage";
import ChatDetailPage from "./pages/ChatDetailPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import ProductivityPage from "./pages/ProductivityPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:chatId" element={<ChatDetailPage />} />
        
        <Route path="/productivity" element={<ProductivityPage />}>
          <Route path="mood-tracker" element={<MoodTrackerPage />} />
          <Route path="goals" element={<GoalsPage />} />
        </Route>

        {/* The detail page for a goal should remain a top-level route */}
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;