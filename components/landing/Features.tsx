"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiChevronRight } from "react-icons/fi";
import { AiOutlineRocket, AiOutlineTrophy, AiOutlineFundProjectionScreen } from "react-icons/ai";
import { BsLightningFill } from "react-icons/bs";

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const FeaturesGrid: React.FC = () => {
    const items = [
        { icon: <AiOutlineRocket className="text-2xl" />, title: "Auto Exam Creator", desc: "Upload PDFs → auto generate mock tests with options & answers." },
        { icon: <BsLightningFill className="text-2xl" />, title: "Speed Trainer", desc: "10-question sprints to boost accuracy and time." },
        { icon: <AiOutlineTrophy className="text-2xl" />, title: "Gamified Journey", desc: "Streaks, badges, leaderboards — learning that feels like a game." },
        { icon: <AiOutlineFundProjectionScreen className="text-2xl" />, title: "Topic Mastery Tracker", desc: "Visualize your strengths and weaknesses per topic." },
    ];
    return (
        <section id="features" className="py-20 bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <motion.h2 initial="hidden" animate="show" variants={fadeUp} className="text-3xl font-bold text-slate-900">
                    Why students choose Math4Code
                </motion.h2>
                <p className="mt-2 text-slate-600 max-w-2xl">Premium features built for focused math practice — designed by exam coaches and coders.</p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((it, i) => (
                        <motion.div key={i} className="p-6 rounded-2xl bg-white shadow-sm border border-slate-100" whileHover={{ y: -6 }}>
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow">{it.icon}</div>
                            <div className="mt-4 text-lg font-semibold text-slate-900">{it.title}</div>
                            <div className="mt-2 text-slate-600 text-sm">{it.desc}</div>
                            <div className="mt-4 flex items-center gap-2 text-indigo-600 font-medium">Learn more <FiChevronRight /></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
