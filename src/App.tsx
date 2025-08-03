import { Routes, Route, Navigate } from 'react-router-dom';
import GoalDetailPage from './pages/GoalDetailPage';
import GoalsPage from './pages/GoalsPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/goals" replace />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />
      </Routes>
      <Toaster richColors closeButton />
    </>
  );
}

export default App;