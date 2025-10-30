"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Grid,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  Home,
  BookCheck,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface SidebarProps {
  menuItems: { icon: keyof typeof iconMap; label: string; href: string }[];
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const iconMap = {
  dashboard: LayoutDashboard,
  user: Users,
  home: Home,
  book: BookOpen,
  grid: Grid,
  settings: Settings,
  question: BookCheck,
};

export default function Sidebar({
  menuItems,
  sidebarCollapsed,
  setSidebarCollapsed,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showControlMenu, setShowControlMenu] = useState(false);
  const [expandMode, setExpandMode] = useState<"expanded" | "collapsed" | "hover">("expanded");

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "auto";
  }, [isMobileOpen]);

  // Handle hover expansion mode
  const handleMouseEnter = () => {
    if (expandMode === "hover") setSidebarCollapsed(false);
  };
  const handleMouseLeave = () => {
    if (expandMode === "hover") setSidebarCollapsed(true);
  };

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen p-4 
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-xl 
        transition-all duration-500 z-30 
        ${sidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 transition-all duration-500">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
            M
          </div>
          {!sidebarCollapsed && (
            <div>
              <h3 className="text-sm font-semibold">Math4Code</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin Panel
              </p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 flex flex-col gap-1">
          {menuItems.map((it) => {
            const Icon = iconMap[it.icon];
            return (
              <Link
                key={it.label}
                href={it.href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl 
                hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              >
                {Icon && (
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                )}
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {it.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse / Control Button */}
        <div className="mt-auto relative">
          <button
            onClick={() => setShowControlMenu((p) => !p)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl 
            bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Menu className="w-4 h-4 text-slate-600 dark:text-slate-200" />
            {!sidebarCollapsed && (
              <span className="text-sm text-slate-700 dark:text-slate-200">
                Sidebar Control
              </span>
            )}
            {!sidebarCollapsed && <ChevronDown className="w-3 h-3" />}
          </button>

          {/* ⚙️ Sidebar Control Popup */}
          <AnimatePresence>
            {showControlMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 left-0 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-50"
              >
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Sidebar Control
                </h4>

                {[
                  { key: "expanded", label: "Expanded" },
                  { key: "collapsed", label: "Collapsed" },
                  { key: "hover", label: "Expand on hover" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => {
                      setExpandMode(mode.key as any);
                      setShowControlMenu(false);
                      setSidebarCollapsed(mode.key === "collapsed");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                      expandMode === mode.key
                        ? "bg-indigo-50 text-indigo-600 dark:bg-slate-700"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {mode.label}
                    {expandMode === mode.key && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* 📱 Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden bg-indigo-600 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 📱 Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Slide-in Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-64 z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                    M
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                      Math4Code
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Admin Panel
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                >
                  ✕
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 flex flex-col gap-2">
                {menuItems.map((it) => {
                  const Icon = iconMap[it.icon];
                  return (
                    <Link
                      key={it.label}
                      href={it.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all"
                    >
                      {Icon && (
                        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {it.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
