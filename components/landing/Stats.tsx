"use client";

import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const StatsSection: React.FC = () => {
    return (
        <section id="stats" className="py-20 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
                <motion.h3 initial="hidden" animate="show" variants={fadeUp} className="text-3xl font-bold text-slate-900">Numbers that matter</motion.h3>
                <p className="mt-2 text-slate-600">Real results from students using Math4Code</p>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="rounded-2xl p-8 bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-xl">
                        <div className="text-sm">Active Students</div>
                        <div className="mt-3 text-3xl font-bold"><CountUp end={12000} separator="," /></div>
                        <div className="mt-2 text-sm opacity-80">and growing every week</div>
                    </div>
                    <div className="rounded-2xl p-8 bg-white shadow">
                        <div className="text-sm text-slate-500">Questions Solved</div>
                        <div className="mt-3 text-2xl font-bold text-slate-900"><CountUp end={200000} separator="," /></div>
                        <div className="mt-2 text-sm text-slate-500">By our community</div>
                    </div>
                    <div className="rounded-2xl p-8 bg-white shadow">
                        <div className="text-sm text-slate-500">Success Rate</div>
                        <div className="mt-3 text-2xl font-bold text-slate-900"><CountUp end={98} />%</div>
                        <div className="mt-2 text-sm text-slate-500">Satisfaction score</div>
                    </div>
                </div>
            </div>
        </section>
    );
};
