"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  Info,
  LogOut,
  X,
  Search,
  Command,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RewardDisplay } from "@/components/RewardDisplay";

import { useNotifications } from "@/hooks/useNotifications";

export default function Header({
  theme,
  toggleTheme,
  sidebarCollapsed,
  profile,
  setSidebarCollapsed
}: {
  theme: string;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  profile: any;
  setSidebarCollapsed: any;
}) {
  const router = useRouter();
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profile?.id);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setOpenNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Force a hard alignment to the login page to clear all React/Query state
    window.location.href = "/auth/login";
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    // Toggle expansion
    if (expandedNotifId === id) {
      setExpandedNotifId(null);
    } else {
      setExpandedNotifId(id);
      // Mark as read if not already
      if (!isRead) {
        markAsRead(id);
      }
    }
  };



  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-4 md:px-8 transition-all duration-300
      ${sidebarCollapsed ? "md:left-20" : "md:left-64"} left-0
      bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm`}
    >
      {/* Left Side: Search or Breadcrumbs */}
      <div className="flex items-center gap-4 ml-12 md:ml-0">
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 pl-10 pr-4 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/20 w-64 text-sm transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] font-medium text-slate-400 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5">⌘K</span>
          </div>
        </div>
      </div>



      {/* Right Side: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Reward Display - Only for Students */}
        {profile?.id && profile?.role === "student" && <RewardDisplay userId={profile.id} userProfile={profile} />}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">


          <button
            onClick={() => setOpenNotif(!openNotif)}
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>

          <AnimatePresence>
            {openNotif && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-14 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden origin-top-right"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.is_read)}
                        className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer
                          ${!notif.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                            ${notif.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                              notif.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  notif.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-slate-100 text-slate-600'}`}>
                            {notif.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                              notif.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                                notif.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                                  <Info className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-medium ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Expandable Message Area */}
                            <div className="mt-1">
                              <p className={`text-xs text-slate-500 dark:text-slate-400 transition-all duration-300 ${expandedNotifId === notif.id ? '' : 'line-clamp-2'}`}>
                                {notif.message}
                              </p>

                              {/* Show 'Show less' if expanded, or nothing if collapsed (implicit 'Show more' via truncation) */}
                              {expandedNotifId === notif.id && (
                                <span className="text-[10px] text-indigo-500 font-medium mt-1 block">
                                  Show less
                                </span>
                              )}
                            </div>

                            {notif.link && expandedNotifId === notif.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(notif.link!);
                                  setOpenNotif(false);
                                }}
                                className="mt-2 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                              >
                                View Details →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                    View All Notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative ml-2">
          <button
            onClick={() => setOpenProfile(!openProfile)}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {profile?.full_name?.[0] || "A"}
            </div>
            <div className="hidden md:block text-left mr-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-none">
                {profile?.full_name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {profile?.role || "Administrator"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          <AnimatePresence>
            {openProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-14 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden origin-top-right"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-medium text-slate-900 dark:text-white">{profile?.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
