import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import GoalPage from './pages/GoalPage';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <main className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/goal/:id" element={<GoalPage />} />
        </Routes>
      </main>
      <Toaster />
    </Router>
  );
}

export default App;