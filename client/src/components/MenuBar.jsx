import { useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  NotebookPen,
  UserRound,
  StethoscopeIcon,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/duty-logs", label: "Duty Logs", icon: NotebookPen },
  { to: "/procedures", label: "Procedures", icon: NotebookPen },
  { to: "/reflections", label: "Reflections", icon: NotebookPen },
  { to: "/reports", label: "Reports", icon: NotebookPen },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function MenuBar() {
  const { user, logoutUser } = useContext(AuthContext);

  return (
    <header className="sticky top-3 z-30 rounded-2xl border border-pink-200 bg-white/80 p-3 shadow-[0_8px_30px_rgba(244,114,182,0.18)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-pink-100 p-2 text-pink-700">
            <StethoscopeIcon size={17} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
              Duty Tracker
            </p>
            <p className="text-sm font-bold text-rose-900">
              {user?.full_name || "Clinician"}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-pink-500 text-white"
                    : "bg-pink-50 text-pink-700 hover:bg-pink-100"
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logoutUser}
          className="inline-flex items-center gap-1.5 rounded-lg border border-pink-300 bg-white px-3 py-1.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
}
