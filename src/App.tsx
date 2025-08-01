import { Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <div>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="text-lg font-bold">
            MyApp
          </Link>
          <div className="space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
              Home
            </Link>
            <Link to="/notifications" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
              Notifications
            </Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto mt-4">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;