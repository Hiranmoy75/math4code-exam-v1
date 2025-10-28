"use client";
import { motion } from "framer-motion";
import {
  BookOpen,
  Grid,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  Home,
  LucideIcon,
  BookCheck,
} from "lucide-react";
import Link from "next/link";

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
  question: BookCheck
};

export default function Sidebar({
  menuItems,
  sidebarCollapsed,
  setSidebarCollapsed,
}: SidebarProps) {
  return (
    <aside
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

      {/* Collapse button */}
      <div className="mt-auto">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center gap-2 justify-center py-2 rounded-xl 
          bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-sm"
        >
          <Menu className="w-4 h-4 text-slate-600 dark:text-slate-200" />
          {!sidebarCollapsed && (
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Collapse
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
