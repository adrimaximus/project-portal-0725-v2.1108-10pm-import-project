import { Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import ProjectDetail from './pages/ProjectDetail';
import MoodTracker from './pages/MoodTracker';
import { Toaster } from "@/components/ui/sonner"
import InvoiceDetail from './pages/InvoiceDetail';
import GoalDetail from './pages/GoalDetail';
import Chat from './pages/Chat';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/chat/:id" element={<Chat />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;