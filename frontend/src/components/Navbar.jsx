import {
  Shield,
  LayoutDashboard,
  History,
  Info,
} from "lucide-react";

import { NavLink } from "react-router-dom";

export default function Navbar() {
  const navClass = ({ isActive }) =>
    `flex items-center gap-2 transition ${
      isActive
        ? "text-purple-400 font-semibold"
        : "text-gray-300 hover:text-purple-400"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

        {/* Logo */}

        <div className="flex items-center gap-4">

          <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 p-3 shadow-[0_0_30px_rgba(168,85,247,.4)]">
            <Shield size={26} />
          </div>

          <div>

            <h1 className="text-3xl font-extrabold tracking-wide">
              SentinelAI
            </h1>

            <p className="text-sm text-gray-400">
              AI-Powered Security Log Analyzer
            </p>

          </div>

        </div>

        {/* Navigation */}

        <div className="flex items-center gap-10">

          <NavLink
            to="/"
            className={navClass}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/history"
            className={navClass}
          >
            <History size={18} />
            History
          </NavLink>

          <NavLink
            to="/about"
            className={navClass}
          >
            <Info size={18} />
            About
          </NavLink>

        </div>

      </div>
    </nav>
  );
}