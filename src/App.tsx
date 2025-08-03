import { Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner"
import Layout from './components/layout/Layout';
import IndexPage from './pages/Index';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:id" element={<GoalDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
      <Toaster />
    </>
  );
}

export default App;