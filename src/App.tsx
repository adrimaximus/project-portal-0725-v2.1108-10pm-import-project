import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "./contexts/AuthContext";
import NotificationHandler from "./components/NotificationHandler";
import { RouterProvider } from "react-router-dom";
import router from "./router";

function App() {
  return (
    <AuthProvider>
      <NotificationHandler />
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  )
}

export default App