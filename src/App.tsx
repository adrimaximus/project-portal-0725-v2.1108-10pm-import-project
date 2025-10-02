import { Routes, Route, Navigate } from 'react-router-dom';
import { GlobalCommand } from './components/GlobalCommand';
import Index from './pages/Index';

function App() {
  return (
    <>
      <GlobalCommand />
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Redirect other paths to home for now, can be expanded */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;