import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import ProjectDetail from './pages/ProjectDetail';
import MoodTracker from './pages/MoodTracker';
import { UserProvider } from './contexts/UserContext';
import { Toaster } from "@/components/ui/sonner"
import InvoiceDetail from './pages/InvoiceDetail';
import GoalDetail from './pages/GoalDetail';
import Chat from './pages/Chat';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/goals/:id" element={<GoalDetail />} />
          <Route path="/chat/:id" element={<Chat />} />
        </Routes>
      </Router>
      <Toaster />
    </UserProvider>
  );
}

export default App;