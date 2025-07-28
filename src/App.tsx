import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PortalLayout from "./components/PortalLayout";
import IndexPage from "./pages/Index";
import ProfilePage from "./pages/Profile";
import RequestPage from "./pages/Request";
import ChatPage from "./pages/Chat";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;