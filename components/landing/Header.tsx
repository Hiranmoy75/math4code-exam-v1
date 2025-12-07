"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RewardDisplay } from "@/components/RewardDisplay";

export const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        // Check authentication status
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch user role
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                setUserRole(profile?.role || null);
            }
        };

        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", session.user.id)
                    .single()
                    .then(({ data }) => setUserRole(data?.role || null));
            } else {
                setUserRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const getDashboardLink = () => {
        if (userRole === "admin") return "/admin/dashboard";
        return "/student/dashboard";
    };

    const navLinks = [
        { name: "Courses", href: "/courses" },
        { name: "Test Series", href: "/student/all-test-series" },
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/70 ${isScrolled
                    ? "bg-white/70 backdrop-blur-lg border-b border-white/20 py-3 shadow-lg shadow-black/5"
                    : "bg-white/50 backdrop-blur-md border-b border-white/10 py-5"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-auto px-2 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-indigo-500/30 transition-all">
                            Σ✨{'}'}
                        </div>
                        <span className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 ${!isScrolled && pathname === "/" ? "text-slate-900" : ""}`}>
                            Math4Code
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors relative group"
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Buttons / Profile */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* {user && (
                            <RewardDisplay userId={user.id} />
                        )} */}
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-medium">
                                            {user.email?.[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem asChild>
                                        <Link href={getDashboardLink()} className="flex items-center gap-2 cursor-pointer">
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-rose-600">
                                        <LogOut className="w-4 h-4" />
                                        <span>Sign out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Link href="/auth/login">
                                    <Button variant="ghost" className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href="/auth/sign-up">
                                    <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 rounded-full px-6">
                                        Sign up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="fixed top-[60px] left-0 right-0 bg-white border-b border-slate-200 z-40 md:hidden overflow-hidden shadow-xl"
                    >
                        <div className="p-6 space-y-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <span className="font-medium">{link.name}</span>
                                    <ChevronRight className="w-4 h-4 opacity-50" />
                                </Link>
                            ))}
                            <div className="pt-4 border-t border-slate-100">
                                {user ? (
                                    <div className="space-y-2">
                                        <Link href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button variant="outline" className="w-full justify-start gap-2 border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
                                                <LayoutDashboard className="w-4 h-4" />
                                                Dashboard
                                            </Button>
                                        </Link>
                                        <Button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start gap-2 border-rose-200 text-rose-600 hover:bg-rose-50">
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button variant="outline" className="w-full justify-center border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
                                                Log in
                                            </Button>
                                        </Link>
                                        <Link href="/auth/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full justify-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                                                Sign up
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
