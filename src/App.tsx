import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ChatPage from "./pages/Chat";
import RequestsPage from "./pages/Requests";
import DashboardPage from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;