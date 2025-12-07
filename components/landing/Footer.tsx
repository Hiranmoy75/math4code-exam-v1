"use client";

import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 font-bold text-2xl text-white mb-4">
                    <span className="text-[#14B8A6]">Math</span>4Code
                </div>
                <p className="max-w-xs text-sm text-slate-400">
                    The premier platform for students who want to master the mathematical foundations of computer science.
                </p>
            </div>

            <div>
                <h4 className="font-bold text-white mb-4">Platform</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-[#14B8A6]">Courses</a></li>
                    <li><a href="#" className="hover:text-[#14B8A6]">Live Mentoring</a></li>
                    <li><a href="#" className="hover:text-[#14B8A6]">Exam Series</a></li>
                    <li><a href="#" className="hover:text-[#14B8A6]">Pricing</a></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="/privacy-policy" className="hover:text-[#14B8A6]">Privacy Policy</a></li>
                    <li><a href="/terms-of-use" className="hover:text-[#14B8A6]">Terms of Use</a></li>
                    <li><a href="/refund-policy" className="hover:text-[#14B8A6]">Refund Policy</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
            © 2025 Math4Code Inc. All rights reserved.
        </div>
    </footer>
);
