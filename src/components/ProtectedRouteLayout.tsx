import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";

const ProtectedRouteLayout = () => {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Di sini Anda bisa menambahkan Header jika perlu */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default ProtectedRouteLayout;