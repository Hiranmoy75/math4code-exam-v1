"use client";
import React from "react";
import { Home, Grid, Bell, Moon, Sun, User, Layers } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function MobileNav({
  theme,
  toggleTheme,
}: {
  theme: string;
  toggleTheme: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: Home, href: "/admin/dashboard" },
    { label: "Series", icon: Layers, href: "/admin/test-series" },
    { label: "Exams", icon: Grid, href: "/admin/exams" },
    // { label: "Profile", icon: User, href: "/admin/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
      <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-12 h-12"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavActive"
                  className="absolute -top-3 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                />
              )}
              <Icon
                className={`w-6 h-6 transition-colors duration-300 ${isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500"
                  }`}
              />
              {/* <span
                className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {item.label}
              </span> */}
            </Link>
          );
        })}

        {/* Theme Toggle Item */}
        <button
          onClick={toggleTheme}
          className="relative flex flex-col items-center justify-center w-12 h-12 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {theme === "light" ? (
            <Moon className="w-6 h-6" />
          ) : (
            <Sun className="w-6 h-6 text-yellow-400" />
          )}
        </button>
      </nav>
    </div>
  );
}
