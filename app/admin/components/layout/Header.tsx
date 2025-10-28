"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  Info,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default function Header({
  theme,
  toggleTheme,
  sidebarCollapsed,
  profile
}: {
  theme: string;
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  profile:any
}) {
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
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
    redirect("/auth/login");
  };

  const notifications = [
    {
      name: "Terry Franci",
      project: "Nganter App",
      time: "5 min ago",
      status: "online",
      img: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Alena Franci",
      project: "Nganter App",
      time: "8 min ago",
      status: "online",
      img: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Jocelyn Kenter",
      project: "Nganter App",
      time: "15 min ago",
      status: "online",
      img: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
      name: "Brandon Philips",
      project: "Nganter App",
      time: "1 hr ago",
      status: "offline",
      img: "https://randomuser.me/api/portraits/men/67.jpg",
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 flex items-center justify-between p-4 bg-white/90 dark:bg-slate-900/70 backdrop-blur-lg shadow-md z-30">
        <button className="p-2 bg-indigo-600 text-white rounded-md">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">
          Dashboard
        </h1>
        <button
          onClick={toggleTheme}
          className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-sm"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-slate-600" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>
      </header>

      {/* Desktop Header */}
      <header
        className={`hidden md:flex fixed top-0 right-0 items-center justify-between h-16 px-8 
        bg-white/90 dark:bg-slate-900/70 backdrop-blur-lg shadow-lg transition-all duration-500 z-20 
        ${sidebarCollapsed ? "left-20" : "left-64"}`}
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of your system
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Button */}
          <div ref={notifRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setOpenNotif(!openNotif)}
              className="relative p-2 rounded-lg bg-white dark:bg-slate-800/60 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-200" />
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold text-white bg-rose-500 rounded-full">
                4
              </span>
            </motion.button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {openNotif && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute right-0 top-12 w-96 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      Notification
                    </h4>
                    <button
                      onClick={() => setOpenNotif(false)}
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {notifications.map((n, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
                      >
                        <div className="relative">
                          <img
                            src={n.img}
                            alt={n.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              n.status === "online"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm text-slate-700 dark:text-slate-100 leading-tight">
                            <span className="font-semibold">{n.name}</span>{" "}
                            requests permission to change{" "}
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                              Project - {n.project}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span>Project</span>
                            <span>•</span>
                            <span>{n.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700">
                    <button className="w-full py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700/40 transition-all">
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Button */}
          <div ref={profileRef} className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => setOpenProfile(!openProfile)}
              className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/60 shadow-sm cursor-pointer border border-slate-100 dark:border-slate-700"
            >
              <div className="w-9 h-9 rounded-md bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-semibold">
                HM
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {profile.full_name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {profile.role || "Administrator"}
                </span>
              </div>
            </motion.div>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {openProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute right-0 top-14 w-64 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {profile.full_name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {profile.email}
                    </p>
                  </div>

                  <div className="flex flex-col py-2">
                    <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-slate-700 dark:text-slate-200">
                      <User className="w-4 h-4" /> Edit Profile
                    </button>
                    <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-slate-700 dark:text-slate-200">
                      <Settings className="w-4 h-4" /> Account Settings
                    </button>
                    <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all text-slate-700 dark:text-slate-200">
                      <Info className="w-4 h-4" /> Support
                    </button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700">
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileTap={{ rotate: 180 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-slate-800/60 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-slate-600" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
          </motion.button>
        </div>
      </header>
    </>
  );
}
