import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import RequestPage from "./pages/Request";
import ProjectDetailPage from "./pages/ProjectDetail";
import Index from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/request",
    element: <RequestPage />,
  },
  {
    path: "/projects/:projectId",
    element: <ProjectDetailPage />,
  },
  // Redirect from a generic path to a specific project for demonstration
  {
    path: "/project-detail",
    element: <Navigate to="/projects/1" replace />,
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App;