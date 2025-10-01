import NotificationHandler from "./components/NotificationHandler";
import { RouterProvider } from "react-router-dom";
import router from "./router";

function App() {
  return (
    <>
      <NotificationHandler />
      <RouterProvider router={router} />
    </>
  )
}

export default App