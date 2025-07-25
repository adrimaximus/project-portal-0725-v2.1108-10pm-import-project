import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PortalLayout from "./components/PortalLayout";
import Index from "./pages/Index";
import RequestPage from "./pages/RequestPage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <Router>
      <PortalLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Anda mungkin perlu membuat halaman-halaman ini jika belum ada */}
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </PortalLayout>
    </Router>
  );
}

export default App;