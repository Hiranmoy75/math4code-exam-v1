"use client";

import React from "react";
import { FiCheckCircle } from "react-icons/fi";

export const Pricing: React.FC = () => {
    const plans = [
        { name: "Free", price: "₹0", perks: ["2 tests/day", "Basic analytics", "Access to practice sets"] },
        { name: "Pro", price: "₹299/mo", perks: ["Unlimited tests", "Advanced analytics", "Speed trainer", "Leaderboards"] },
        { name: "Master", price: "₹699/mo", perks: ["All Pro features", "Rank predictor", "1-on-1 mentor sessions"] },
    ];
    return (
        <section className="py-20 bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <h3 className="text-3xl font-bold text-slate-900">Pricing that fits every learner</h3>
                <p className="text-slate-600 mt-2">Start free. Upgrade when you feel the difference.</p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {plans.map((p, i) => (
                        <div key={i} className={`rounded-2xl p-6 ${i === 1 ? "bg-indigo-600 text-white shadow-2xl" : "bg-white border"}`}>
                            <div className="text-sm font-semibold">{p.name}</div>
                            <div className="mt-4 text-3xl font-bold">{p.price}</div>
                            <ul className={`mt-4 space-y-2 ${i === 1 ? "text-white/90" : "text-slate-600"}`}>
                                {p.perks.map((k, j) => <li key={j} className="flex items-center gap-2"><FiCheckCircle /> {k}</li>)}
                            </ul>
                            <div className="mt-6">
                                <button className={`${i === 1 ? "bg-white text-indigo-600" : "bg-indigo-600 text-white"} px-4 py-2 rounded-xl w-full`}>Choose</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
