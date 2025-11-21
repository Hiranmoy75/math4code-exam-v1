"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export const Testimonials: React.FC = () => {
    const t = [
        { name: "Riya Sen", note: "I improved 20% in 6 weeks — the practice sets are so focused." },
        { name: "Sourav Das", note: "Auto PDF upload and exam creation saved me weeks of manual work." },
        { name: "Asha Roy", note: "The speed trainer made me faster and less anxious." },
    ];
    const [idx, setIdx] = useState(0);
    return (
        <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <h4 className="text-2xl font-bold text-slate-900">Students ❤️ Math4Code</h4>
                <p className="text-slate-600 mt-2">Success stories from our community</p>

                <div className="mt-8">
                    <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="rounded-xl p-8 bg-gradient-to-br from-indigo-50 to-white border">
                            <div className="text-slate-700 text-lg">“{t[idx].note}”</div>
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-600 font-semibold">{t[idx].name.split(" ").map(n => n[0]).join("")}</div>
                                <div className="text-sm text-slate-700 font-medium">{t[idx].name}</div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="mt-4 flex items-center justify-center gap-3">
                        <button onClick={() => setIdx((s) => (s - 1 + t.length) % t.length)} className="px-3 py-1 rounded bg-white/6">Prev</button>
                        <button onClick={() => setIdx((s) => (s + 1) % t.length)} className="px-3 py-1 rounded bg-indigo-600 text-white">Next</button>
                    </div>
                </div>
            </div>
        </section>
    );
};
