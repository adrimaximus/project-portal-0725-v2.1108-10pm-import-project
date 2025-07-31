import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import NotFound from './pages/NotFound';
import { GoalsProvider } from './context/GoalsContext';

function App() {
  return (
    <GoalsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:goalId" element={<GoalDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </GoalsProvider>
  );
}

export default App;