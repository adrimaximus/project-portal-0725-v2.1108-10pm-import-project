import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import Index from "./pages/Index";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/goals",
    element: <GoalsPage />,
  },
  {
    path: "/goals/:goalId",
    element: <GoalDetailPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;