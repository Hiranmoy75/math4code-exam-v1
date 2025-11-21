"use client";

import React from "react";
import Link from "next/link";

export const CTA: React.FC = () => (
    <section className="py-16 bg-gradient-to-b from-indigo-600 to-violet-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-3xl font-bold">Ready to level up your math game?</h3>
            <p className="mt-2 text-indigo-100">Join thousands of students practicing smarter — not harder.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
                <Link href="/auth/signup" className="px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold">Get Started — It's Free</Link>
                <a href="#features" className="px-6 py-3 rounded-xl border border-white/30">See features</a>
            </div>
        </div>
    </section>
);
