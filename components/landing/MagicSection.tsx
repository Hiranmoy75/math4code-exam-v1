"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { FiCheckCircle } from "react-icons/fi";
import { AiOutlineTrophy } from "react-icons/ai";
import { FaCrown, FaUsers } from "react-icons/fa";

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const StatCard: React.FC<{ title: string; value: number; percent?: boolean; icon?: React.ReactNode }> = ({ title, value, percent, icon }) => {
    return (
        <div className="rounded-xl p-4 border bg-white">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">{icon}</div>
                <div>
                    <div className="text-xs text-slate-500">{title}</div>
                    <div className="text-lg font-semibold text-slate-900">{percent ? <><CountUp end={value} />%</> : <CountUp end={value} />}</div>
                </div>
            </div>
        </div>
    );
};

export const MagicSection: React.FC = () => {
    return (
        <section className="py-20 bg-gradient-to-b from-white to-slate-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 grid gap-12 lg:grid-cols-2 items-center">
                <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-6">
                    <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-semibold">
                        <FaCrown /> Premium Experience
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">Built for serious aspirants — simple for beginners</h3>
                    <p className="text-slate-600">From auto exam creation to powerful topic analytics and a gamified journey — Math4Code blends efficiency with delight. Everything is tailored to keep you practicing and improving.</p>

                    <ul className="mt-4 grid gap-3">
                        <li className="flex items-start gap-3">
                            <div className="mt-1 text-indigo-600"><FiCheckCircle /></div>
                            <div>
                                <div className="font-semibold text-slate-900">Practice with purpose</div>
                                <div className="text-slate-600 text-sm">Curated sets by topic, difficulty and your performance history.</div>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 text-indigo-600"><FiCheckCircle /></div>
                            <div>
                                <div className="font-semibold text-slate-900">Realistic test simulator</div>
                                <div className="text-slate-600 text-sm">Full screen mock tests with question palette, review flag and time management tools.</div>
                            </div>
                        </li>
                    </ul>

                    <div className="mt-6 flex gap-3">
                        <Link href="/auth/signup" className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white">Get Started</Link>
                        <a href="#stats" className="rounded-xl px-4 py-2 border border-slate-200">See Stats</a>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-xl">
                        <div className="p-6 bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                            <div className="text-sm">Progress snapshot</div>
                            <div className="mt-3 text-2xl font-semibold">Week 4 — Personalized Plan</div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-3 rounded-lg">
                                    <div className="text-xs text-white/80">Focus</div>
                                    <div className="mt-1 font-bold">Integration</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-lg">
                                    <div className="text-xs text-white/80">Streak</div>
                                    <div className="mt-1 font-bold">6 days</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-lg col-span-2">
                                    <div className="text-xs text-white/80">Next Suggested Set</div>
                                    <div className="mt-1 font-bold">10 Practice Questions — Medium</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-white">
                            <div className="text-slate-700 font-semibold">Practice history</div>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                <StatCard title="Questions Solved" value={1200} icon={<FaUsers />} />
                                <StatCard title="Avg Accuracy" value={76} percent icon={<AiOutlineTrophy />} />
                                <StatCard title="Leader Rank" value={32} icon={<FaCrown />} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
