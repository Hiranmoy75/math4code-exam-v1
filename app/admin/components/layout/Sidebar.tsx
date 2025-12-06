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
  LogOut,
  X,
  GraduationCap,
  Layers,
  Award,
  TrendingUp,
  CreditCard,
  Gift,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useCommunityModal } from "@/context/CommunityModalContext";

interface SidebarProps {
  menuItems: { icon: keyof typeof iconMap; label: string; href: string; onClick?: string }[];
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  profile?: any;
}

const iconMap = {
  dashboard: LayoutDashboard,
  user: Users,
  home: Home,
  book: BookOpen,
  grid: Grid,
  settings: Settings,
  question: BookCheck,
  layers: Layers,
  graduation: GraduationCap,
  bookopen: BookOpen,
  trendingup: TrendingUp,
  award: Award,
  payment: CreditCard,
  gift: Gift,
  messagesquare: MessageSquare,
};



export default function Sidebar({
  menuItems,
  sidebarCollapsed,
  setSidebarCollapsed,
  profile,
}: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showControlMenu, setShowControlMenu] = useState(false);
  const [expandMode, setExpandMode] = useState<"expanded" | "collapsed" | "hover">("expanded");
  const { openCommunity } = useCommunityModal();

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

  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    if (item.onClick === "openCommunity") {
      const isAdmin = profile?.role === 'admin' || profile?.role === 'creator';
      openCommunity({ isAdmin });
    }
  };

  return (
    <>
      {/* 🖥️ Desktop Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen p-4 
        bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800
        transition-all duration-500 z-40 
        ${sidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 mb-8 transition-all duration-500 ${sidebarCollapsed ? "justify-center" : "px-2"}`}>
          <div className="w-auto px-2 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <span className="text-xl">Σ✨{'}'}</span>
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Math4Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Admin Workspace
              </p>
            </motion.div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar py-2">
          {menuItems.map((it) => {
            const Icon = iconMap[it.icon as keyof typeof iconMap] || Grid;
            const isActive = pathname === it.href || pathname.startsWith(`${it.href}/`);
            const hasOnClick = it.onClick === "openCommunity";

            if (hasOnClick) {
              return (
                <button
                  key={it.label}
                  onClick={() => handleMenuItemClick(it)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden
                  ${isActive
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full"
                    />
                  )}
                  <Icon className={`w-5 h-5 min-w-[1.25rem] transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"}`} />

                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium truncate"
                    >
                      {it.label}
                    </motion.span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {it.label}
                    </div>
                  )}
                </button>
              );
            }

            return (
              <Link
                key={it.label}
                href={it.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative overflow-hidden
                ${isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full"
                  />
                )}
                <Icon className={`w-5 h-5 min-w-[1.25rem] transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"}`} />

                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium truncate"
                  >
                    {it.label}
                  </motion.span>
                )}

                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {it.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>


        {/* Collapse / Control Button */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowControlMenu((p) => !p)}
            className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl 
            hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
            ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 text-left">
                  <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Settings
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showControlMenu ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          {/* ⚙️ Sidebar Control Popup */}
          <AnimatePresence>
            {showControlMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`absolute bottom-20 ${sidebarCollapsed ? 'left-0 w-56' : 'left-4 right-4'} rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 overflow-hidden`}
              >
                <div className="px-2 py-1.5 mb-1">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sidebar Mode
                  </h4>
                </div>

                {[
                  { key: "expanded", label: "Always Expanded" },
                  { key: "collapsed", label: "Always Collapsed" },
                  { key: "hover", label: "Expand on Hover" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => {
                      setExpandMode(mode.key as any);
                      setShowControlMenu(false);
                      setSidebarCollapsed(mode.key === "collapsed");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${expandMode === mode.key
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    {mode.label}
                    {expandMode === mode.key && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
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
        className="fixed top-4 left-4 z-50 md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
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
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Slide-in Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col md:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-auto px-2 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                    Σ✨{'}'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Math4Code
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Admin Panel
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                {menuItems.map((it) => {
                  const Icon = iconMap[it.icon as keyof typeof iconMap] || Grid;
                  const isActive = pathname === it.href || pathname.startsWith(`${it.href}/`);
                  const hasOnClick = it.onClick === "openCommunity";

                  if (hasOnClick) {
                    return (
                      <button
                        key={it.label}
                        onClick={() => {
                          handleMenuItemClick(it);
                          setIsMobileOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                        <span className="text-sm">
                          {it.label}
                        </span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                        )}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={it.label}
                      href={it.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                      <span className="text-sm">
                        {it.label}
                      </span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                  © 2025 Math4Code. All rights reserved.
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
