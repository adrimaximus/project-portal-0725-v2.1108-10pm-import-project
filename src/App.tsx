import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SettingsPage from './pages/SettingsPage';
import ThemeSettingsPage from './pages/ThemeSettingsPage';
// Assuming other pages might exist, adding a placeholder for the root
const IndexPage = () => <div>Welcome! Navigate to /settings to see the changes.</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/theme" element={<ThemeSettingsPage />} />
        {/* Redirect any other path to root for simplicity */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;