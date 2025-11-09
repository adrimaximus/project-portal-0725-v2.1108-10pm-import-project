import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import IndexPage from './pages/Index';
import { ChatProvider } from './contexts/ChatContext';
import { ThemeProvider } from './contexts/ThemeProvider';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ChatProvider>
        <Router>
          <Routes>
            <Route path="/" element={<IndexPage />} />
          </Routes>
        </Router>
        <Toaster />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;