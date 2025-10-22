import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import ThemeSettingsPage from './pages/ThemeSettingsPage';
import { ThemeProvider } from './contexts/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/settings/theme" element={<ThemeSettingsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;