import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ProjectProvider } from '@/context/ProjectContext';
import DashboardPage from './pages/Dashboard';
import NewRequestPage from './pages/NewRequest';
import ChatPage from './pages/Chat';
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<Navigate to="/" />} />
          <Route path="/requests/new" element={<NewRequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
          {/* Tambahkan rute lain di sini jika diperlukan */}
        </Routes>
      </Router>
      <Toaster />
    </ProjectProvider>
  );
}

export default App;