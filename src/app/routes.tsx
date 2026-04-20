import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import FocusMode from "./pages/FocusMode";
import CalendarView from "./pages/CalendarView";
import WheelPage from "./pages/WheelPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "focus", Component: FocusMode },
      { path: "calendar", Component: CalendarView },
      { path: "wheel", Component: WheelPage },
    ],
  },
]);
