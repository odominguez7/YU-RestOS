import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { path: "/oura", label: "My Biology" },
  { path: "/drift", label: "Drift Detection" },
  { path: "/recovery", label: "Recovery" },
  { path: "/action-status", label: "Execution" },
];

const NavBar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Hide nav on landing
  if (location.pathname === "/") return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(10,14,39,0.85)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-14">
        <Link to="/" className="text-lg font-extrabold tracking-tight"
          style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          YU RestOS
        </Link>

        {/* Desktop nav — demo flow steps */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l, i) => (
            <div key={l.path} className="flex items-center">
              {i > 0 && <span className="text-slate-700 mx-1 text-xs">&rarr;</span>}
              <Link to={l.path}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                style={{
                  color: location.pathname === l.path ? "#C4B5FD" : "rgba(255,255,255,0.35)",
                  background: location.pathname === l.path ? "rgba(139,92,246,0.12)" : "transparent",
                }}>
                {l.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-slate-400 border-0 bg-transparent cursor-pointer p-1">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] px-5 py-3 space-y-1"
          style={{ background: "rgba(10,14,39,0.95)" }}>
          {navLinks.map((l) => (
            <Link key={l.path} to={l.path} onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{
                color: location.pathname === l.path ? "#C4B5FD" : "rgba(255,255,255,0.5)",
                background: location.pathname === l.path ? "rgba(139,92,246,0.1)" : "transparent",
              }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
