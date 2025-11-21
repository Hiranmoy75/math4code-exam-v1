"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiChevronRight } from "react-icons/fi";
import { AiOutlineRocket, AiOutlineTrophy } from "react-icons/ai";
import { FaUsers } from "react-icons/fa";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const MiniDemo: React.FC = () => {
  const sample = useMemo(
    () => [
      { id: 1, q: "If f(x)=x^2, f'(2) equals?", opts: ["2", "4", "1", "0"], a: 1 },
      { id: 2, q: "Limit of sin(x)/x as x→0 is:", opts: ["0", "1", "∞", "doesn't exist"], a: 1 },
      { id: 3, q: "Derivative of ln(x) is:", opts: ["1/x", "ln(x)", "x", "x^2"], a: 0 },
    ],
    []
  );
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="bg-white/6 p-3 rounded-xl">
      <div className="text-sm text-slate-200">Question {idx + 1} / {sample.length}</div>
      <div className="mt-2 font-medium text-white text-sm">{sample[idx].q}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {sample[idx].opts.map((o, i) => (
          <button
            key={i}
            onClick={() => setChosen(i)}
            className={`text-left rounded-lg p-2 border ${chosen === i ? "border-indigo-400 bg-indigo-500/20" : "border-white/6"} text-slate-100`}
          >
            <div className="text-sm">{String.fromCharCode(97 + i)}. {o}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
        <div>{chosen === null ? "Choose an answer" : chosen === sample[idx].a ? <span className="text-emerald-400 font-medium">Correct</span> : <span className="text-rose-400 font-medium">Incorrect</span>}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setChosen(null); setIdx((s) => Math.max(0, s - 1)); }} className="px-3 py-1 rounded bg-white/6">Prev</button>
          <button onClick={() => { setChosen(null); setIdx((s) => Math.min(sample.length - 1, s + 1)); }} className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700">Next</button>
        </div>
      </div>
    </div>
  );
};

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#0f172a] to-[#050816] text-white pt-20 pb-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <div className="max-w-xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                Math4Code — Learn. Compete. Conquer.
              </h1>
              <p className="mt-6 text-slate-300 text-lg">
                Smart practice for IIT-JAM & JEE aspirants — upload PDFs, auto-generate mock exams,
                track mastery, and level up with gamified practice.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 shadow-lg">
                  <AiOutlineRocket className="text-white" />
                  <span className="font-semibold">Start Practicing — Free</span>
                  <FiChevronRight className="ml-2" />
                </Link>

                <a href="#features" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/6 hover:bg-white/10">
                  <span>Explore Features</span>
                </a>
              </div>

              <div className="mt-6 flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center shadow">
                    <FaUsers className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">12k+</div>
                    <div className="text-slate-400">Active students</div>
                  </div>
                </div>

                <div className="h-6 w-px bg-white/10" />

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-orange-400 to-rose-500 flex items-center justify-center shadow">
                    <AiOutlineTrophy className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">98%</div>
                    <div className="text-slate-400">Satisfaction</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="rounded-3xl border border-white/6 bg-gradient-to-br from-white/4 to-white/2 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-300">Live Demo</div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-2xl font-semibold">Mock Test — 3Q</div>
                      <div className="text-xs px-2 py-1 rounded bg-white/6 text-slate-200">Practice</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300">⏱ 5 mins</div>
                </div>

                <div className="mt-4 space-y-4">
                  <MiniDemo />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button className="flex-1 rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700">Try Full Demo</button>
                  <button className="rounded-xl px-4 py-2 border border-white/10 bg-transparent">Preview</button>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-400 opacity-30 blur-3xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
