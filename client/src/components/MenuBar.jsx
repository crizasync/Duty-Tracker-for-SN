import UserAvatar from "./UserAvatar";
import { useContext, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  NotebookPen,
  UserRound,
  Heart,
  Sparkles,
  Stethoscope,
  BookOpen,
  ChartNoAxesCombined,
  Menu,
  X,
  MapPinned,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import ThemePicker from "./ThemePicker";
import HeadingCat from "./HeadingCat";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/duty-logs", label: "Duty Logs", icon: NotebookPen },
  { to: "/procedures", label: "Procedures", icon: Stethoscope },
  { to: "/reflections", label: "Reflections", icon: BookOpen },
  { to: "/geomap", label: "GeoMap", icon: MapPinned },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function MenuBar() {
  const { user, logoutUser } = useContext(AuthContext);
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`workspace-nav z-30 ${menuOpen ? "menu-expanded" : ""}`}>
      <div className="mobile-topbar">
        <button type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <span>Duty-Tracker <Heart size={12} /></span>
        <NavLink to="/profile" aria-label="Your profile" className="mobile-avatar">{<UserAvatar user={user} />}</NavLink>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="workspace-brand flex items-center gap-2">
          <div className="brand-mark rounded-xl bg-pink-100 p-2 text-pink-700">
            <Heart size={22} strokeWidth={1.8} />
            <Sparkles size={11} className="brand-sparkle" />
          </div>
          <div>
            <p className="brand-name text-pink-600">
              Duty-Tracker
            </p>
            <p className="brand-tagline text-rose-900">
              Your care, organized
            </p>
          </div>
          <button type="button" className="mobile-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        <nav id="workspace-navigation" aria-label="Main navigation" className={`workspace-links flex flex-wrap items-center gap-2 ${menuOpen ? "is-open" : ""}`}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
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

        <div className="workspace-tools flex flex-wrap items-center gap-2">
          <span className="workspace-page-label">{navItems.find((item) => item.to === pathname || pathname.startsWith(`${item.to}/`))?.label || "Workspace"}</span>
          <span className="user-monogram" title={user?.full_name || "Clinician"} aria-label={`Signed in as ${user?.full_name || "Clinician"}`}>{<UserAvatar user={user} />}</span>
          <span className="workspace-user-name">{user?.full_name || "Clinician"}</span>
          <HeadingCat />
          <ThemePicker />
          <button
            type="button"
            aria-label="Sign out"
            onClick={logoutUser}
            className="inline-flex items-center gap-1.5 rounded-lg border border-pink-300 bg-white px-3 py-1.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
