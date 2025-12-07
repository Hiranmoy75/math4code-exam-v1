"use client";
import React from "react";
import {
  BookOpen,
  Grid,
  LayoutDashboard,
  Settings,
  Users,
  Home,
  BookCheck,
  Layers,
  Award,
  TrendingUp,
  CreditCard,
  Gift,
  MessageSquare,
  GraduationCap
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCommunityModal } from "@/context/CommunityModalContext";

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

export default function MobileNav({
  theme,
  toggleTheme,
  links,
  profile,
}: {
  theme: string;
  toggleTheme: () => void;
  links: any[];
  profile?: any;
}) {
  const pathname = usePathname();
  const { openCommunity } = useCommunityModal();

  // Filter links for mobile if needed, or use all. 
  // Typically bottom nav has 4-5 items. 
  // If many items, maybe show first 4 and a "More" or just scroll?
  // User asked for "same as app". App has Home, Library, Community, Account.
  // The links prop passed from StudentLayout has: Dashboard, My Courses, All Courses, Community, My Series, Result, Rewards, All Series, Settings.
  // That's too many for a bottom bar.
  // I should filter for the main ones that match the app.

  const appTabs = ["Dashboard", "My Courses", "Community", "Settings"];

  // Dynamic filtering:
  const navItems = links?.filter(link => appTabs.includes(link.label)) || [];

  // Fallback to ensure we have at least these if links are missing/renamed
  // But wait, "My Courses" in links has label "My Courses".
  // "Settings" has label "Settings".
  // "Community" has label "Community".
  // "Dashboard" has label "Dashboard".

  const handleItemClick = (item: any) => {
    if (item.onClick === "openCommunity") {
      const isAdmin = profile?.role === 'admin' || profile?.role === 'creator';
      openCommunity({ isAdmin });
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe">
      <nav className="flex items-center justify-around w-full h-16">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] || Grid;
          const isActive = pathname === item.href || (item.href !== '#' && pathname.startsWith(item.href));
          const isCommunity = item.label === "Community";

          const content = (
            <div className="flex flex-col items-center justify-center w-full h-full gap-1">
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${isActive || (isCommunity && false) // Community doesn't have active route usually
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400"
                    }`}
                />
                {isActive && (
                  <motion.div
                    layoutId="mobileNavDot"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                {item.label === "My Courses" ? "Library" : item.label === "Dashboard" ? "Home" : item.label === "Settings" ? "Account" : item.label}
              </span>
            </div>
          );

          if (item.onClick === "openCommunity") {
            return (
              <button
                key={item.label}
                onClick={() => handleItemClick(item)}
                className="flex-1 h-full"
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex-1 h-full flex"
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
