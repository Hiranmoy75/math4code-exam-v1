"use client";

import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => (
    <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
            <div>
                <div className="text-2xl font-bold text-white">Math4Code</div>
                <div className="mt-2 text-sm">Premium exam & practice platform for serious aspirants.</div>
            </div>

            <div>
                <div className="font-semibold text-white">Product</div>
                <ul className="mt-2 space-y-2 text-sm">
                    <li><Link href="/student/dashboard" className="hover:underline">Dashboard</Link></li>
                    <li><Link href="/student/all-test-series" className="hover:underline">Test Series</Link></li>
                    <li><Link href="/upload" className="hover:underline">Upload PDF</Link></li>
                </ul>
            </div>

            <div>
                <div className="font-semibold text-white">Contact</div>
                <div className="mt-2 text-sm">admin@math4code.com</div>
                <div className="mt-4 text-xs text-slate-500">© {new Date().getFullYear()} Math4Code — Made with ♥ by Hiranmoy</div>
            </div>
        </div>
    </footer>
);
