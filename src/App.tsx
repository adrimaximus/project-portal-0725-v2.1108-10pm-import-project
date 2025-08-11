import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import DashboardPage from "@/pages/Dashboard";
import LoginPage from "@/pages/Login";
import RequestPage from "@/pages/Request";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request"
          element={
            <ProtectedRoute>
              <RequestPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;