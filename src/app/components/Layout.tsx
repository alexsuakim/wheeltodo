import { Outlet, NavLink } from "react-router";
import { Home, Calendar } from "lucide-react";

export default function Layout() {
  return (
    <div className="size-full flex flex-col bg-white">
      <Outlet />

      <nav
        className="fixed bottom-0 left-0 right-0 border-t flex justify-around items-center"
        style={{
          backgroundColor: "#FFF",
          borderColor: "#F3F4F6",
          height: "60px",
          paddingBottom: "env(safe-area-inset-bottom, 0px)"
        }}
      >
        <NavLink
          to="/"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all"
          style={({ isActive }) => ({
            color: isActive ? "#6B7280" : "#9CA3AF"
          })}
        >
          {({ isActive }) => (
            <>
              <Home className="w-5 h-5" fill={isActive ? "currentColor" : "none"} />
              <span style={{ fontSize: "11px" }}>Today</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/calendar"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all"
          style={({ isActive }) => ({
            color: isActive ? "#6B7280" : "#9CA3AF"
          })}
        >
          {({ isActive }) => (
            <>
              <Calendar className="w-5 h-5" fill={isActive ? "currentColor" : "none"} />
              <span style={{ fontSize: "11px" }}>Calendar</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
}
