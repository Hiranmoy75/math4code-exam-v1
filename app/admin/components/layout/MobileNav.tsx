'use client'
import React from "react";
import { Home, Grid, Bell, Moon, Sun, User } from "lucide-react";

export default function MobileNav({
  theme,
  toggleTheme,
}: {
  theme: string;
  toggleTheme: () => void;
}) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/70 backdrop-blur-lg shadow-2xl rounded-t-2xl flex items-center justify-around py-3 px-4 z-50">
      <a href="#" className="flex flex-col items-center text-slate-600 dark:text-slate-200">
        <Home className="w-6 h-6" />
        <span className="text-[10px] mt-1">Home</span>
      </a>
      <a href="#" className="flex flex-col items-center text-slate-600 dark:text-slate-200">
        <Grid className="w-6 h-6" />
        <span className="text-[10px] mt-1">Bank</span>
      </a>
      <a href="#" className="flex flex-col items-center text-slate-600 dark:text-slate-200">
        <Bell className="w-6 h-6" />
        <span className="text-[10px] mt-1">Alerts</span>
      </a>
      <button onClick={toggleTheme} className="flex flex-col items-center text-slate-600 dark:text-slate-200">
        {theme === "light" ? ( <Moon className="w-6 h-6" /> ) : ( <Sun className="w-6 h-6 text-yellow-400" /> )}
        <span className="text-[10px] mt-1">Theme</span>
      </button>
      <a href="#" className="flex flex-col items-center text-slate-600 dark:text-slate-200">
        <User className="w-6 h-6" />
        <span className="text-[10px] mt-1">Profile</span>
      </a>
    </nav>
  );
}
