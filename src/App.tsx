import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BillingPage from './pages/Billing';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/" element={<Navigate to="/billing" />} />
      </Routes>
      <Toaster richColors />
    </Router>
  );
}

export default App;