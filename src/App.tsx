import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner"
import { GoalsProvider } from './context/GoalsContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/layout/Layout';
import IndexPage from './pages/Index';
import GoalsPage from './pages/Goals';
import GoalDetailPage from './pages/GoalDetail';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <SettingsProvider>
      <GoalsProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<IndexPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/goals/:id" element={<GoalDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </GoalsProvider>
    </SettingsProvider>
  );
}

export default App;