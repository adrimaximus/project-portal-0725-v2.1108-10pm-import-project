import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RequestPage from "./pages/Request";
import ChatPage from "./pages/Chat";
import { ChatProvider } from "@/context/ChatContext";

function App() {
  return (
    <Router>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </ChatProvider>
    </Router>
  );
}

export default App;