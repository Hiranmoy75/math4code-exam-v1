/* app/(public)/page.tsx */
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Menu, X, ChevronRight, Check, Star, Play,
    BookOpen, Code, Shield, Trophy, ArrowRight,
    Calculator, Terminal, GraduationCap, Users,
    Sparkles, MessageSquare, Send, Loader2, Bot,
    ShoppingCart, CreditCard
} from 'lucide-react';

// --- Theme Constants ---
const COLORS = {
    primary: '#1F2A6B', // Deep Indigo
    accent1: '#14B8A6', // Vibrant Teal
    accent2: '#F6C85F', // Warm Gold
    bg: '#FBFBFD',      // Off-white
    text: '#374151',    // Slate Grey
};

// --- API Helper ---
const callGemini = async (prompt: string, systemInstruction: string = "") => {
    const apiKey = "AIzaSyAQqcaxfNfRAUtWCc_SEDVQGAsZvzUjWQk"; // Runtime provided key
    let delay = 1000;

    for (let i = 0; i < 5; i++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
                    })
                }
            );

            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        } catch (error) {
            if (i === 4) throw error;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
};

// --- Mock Data ---
const COURSES = [
    { id: 'c1', title: 'Advanced Calculus & Limits', level: 'University', price: 49, students: '2.4k', rating: 4.9, color: 'bg-blue-100 text-blue-800' },
    { id: 'c2', title: 'Python for Data Science', level: 'Beginner', price: 39, students: '5.1k', rating: 4.8, color: 'bg-teal-100 text-teal-800' },
    { id: 'c3', title: 'JEE Mains: Algebra', level: 'High School', price: 29, students: '12k', rating: 4.9, color: 'bg-orange-100 text-orange-800' },
    { id: 'c4', title: 'Algorithmic Logic', level: 'Advanced', price: 59, students: '1.8k', rating: 5.0, color: 'bg-purple-100 text-purple-800' },
];

const EXAM_SERIES = [
    { id: 'e1', title: 'JEE Advanced Mock Series 2025', price: 15, questions: 500, type: 'Exam' },
    { id: 'e2', title: 'SAT Math Prep Bundle', price: 12, questions: 300, type: 'Exam' },
    { id: 'e3', title: 'CSIR NET Mathematical Science', price: 25, questions: 800, type: 'Exam' },
];

const TESTIMONIALS = [
    { id: 1, name: 'Aarav P.', role: 'JEE Aspirant', text: "The adaptive practice problems changed the game for me. I finally understood where my logic was breaking down.", score: 'JEE Rank 452' },
    { id: 2, name: 'Sarah L.', role: 'CS Undergrad', text: "Math4Code bridges the gap between abstract math and actual coding. The Python visualization tool is genius.", score: 'A+ in Algorithms' },
    { id: 3, name: 'Rahul K.', role: 'High School Student', text: "The mock exams are actually harder than the real thing, which made the actual exam feel like a breeze.", score: '99.8 Percentile' },
];

const FEATURES = [
    { icon: <Calculator className="w-6 h-6" />, title: "Adaptive Math", desc: "Problems that get harder as you get smarter." },
    { icon: <Terminal className="w-6 h-6" />, title: "Live Coding", desc: "Run Python and JS directly in the browser." },
    { icon: <Shield className="w-6 h-6" />, title: "Secure Exams", desc: "Anti-cheat proctoring for serious mock tests." },
    { icon: <Users className="w-6 h-6" />, title: "Live Mentoring", desc: "Instant doubt resolution from top tutors." },
];

// --- Components ---

const Logo = () => (
    <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-[#1F2A6B]">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#1F2A6B] text-white">
            <span className="text-sm absolute left-1.5 top-2">{`{`}</span>
            <span className="text-lg">∑</span>
            <span className="text-sm absolute right-1.5 bottom-2">{`}`}</span>
        </div>
        <span>Math4Code</span>
    </div>
);

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <Logo />

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
                    <a href="#courses" className="hover:text-[#1F2A6B] transition-colors">Courses</a>
                    <a href="#schools" className="hover:text-[#1F2A6B] transition-colors">For Schools</a>
                    <a href="#pricing" className="hover:text-[#1F2A6B] transition-colors">Pricing</a>
                    <button className="text-[#1F2A6B] font-semibold">Login</button>
                    <button className="bg-[#14B8A6] hover:bg-[#0d9488] text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-teal-200 hover:shadow-teal-300 active:scale-95">
                        Get Started
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-[#1F2A6B]" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <div className="px-6 py-4 flex flex-col gap-4 text-slate-600 font-medium">
                            <a href="#courses">Courses</a>
                            <a href="#schools">For Schools</a>
                            <a href="#pricing">Pricing</a>
                            <hr />
                            <button className="text-[#1F2A6B] text-left">Login</button>
                            <button className="bg-[#14B8A6] text-white py-3 rounded-lg font-semibold text-center">Get Started</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#FBFBFD]">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-50 to-transparent opacity-50 -z-10" />
            <div className="absolute top-20 left-10 w-64 h-64 bg-teal-50 rounded-full blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-[#1F2A6B] px-3 py-1 rounded-full text-sm font-bold mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#1F2A6B] animate-pulse" />
                        New: JEE Advanced 2025 Module
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-[#1F2A6B] leading-[1.1] mb-6 tracking-tight">
                        Master Math. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-blue-500">
                            Code Confidently.
                        </span>
                    </h1>
                    <p className="text-lg text-slate-500 mb-8 max-w-lg leading-relaxed">
                        Structured courses, exam-style tests, and live mentoring.
                        The only LMS built specifically for the intersection of logic and code.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button className="bg-[#1F2A6B] hover:bg-[#161e4d] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 transition-transform hover:-translate-y-1 flex items-center justify-center gap-2 group">
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="bg-white border border-gray-200 text-slate-600 hover:border-[#1F2A6B] hover:text-[#1F2A6B] px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                            <Play className="w-5 h-5 fill-current" />
                            Watch Demo
                        </button>
                    </div>

                    <div className="mt-10 flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 13}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p>Trusted by <span className="text-[#1F2A6B] font-bold">10,000+</span> top students</p>
                    </div>
                </motion.div>

                {/* Right Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden lg:block"
                >
                    {/* Main Card */}
                    <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 max-w-md mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="text-xs font-mono text-gray-400">algorithm.py</div>
                        </div>

                        <div className="space-y-3 font-mono text-sm">
                            <div className="text-purple-600">def <span className="text-blue-600">calculate_limit</span>(f, x):</div>
                            <div className="pl-4 text-gray-500"># Approaching infinity</div>
                            <div className="pl-4 text-slate-700">epsilon = <span className="text-orange-500">1e-10</span></div>
                            <div className="pl-4 text-slate-700">delta = f(x + epsilon) - f(x)</div>
                            <div className="pl-4 text-slate-700">return delta / epsilon</div>
                        </div>

                        <div className="mt-8 bg-indigo-50 rounded-xl p-4 flex items-center gap-4">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <Check className="text-green-500" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Result</div>
                                <div className="font-bold text-[#1F2A6B]">Tests Passed: 12/12</div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute top-10 -right-4 bg-white p-4 rounded-2xl shadow-xl z-20 flex flex-col items-center"
                    >
                        <div className="text-[#F6C85F] font-bold text-2xl">4.9</div>
                        <div className="flex text-[#F6C85F] gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">Avg Rating</div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 15, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                        className="absolute -bottom-6 -left-4 bg-[#1F2A6B] text-white p-4 rounded-2xl shadow-xl z-20"
                    >
                        <Trophy size={24} className="mb-2 text-[#F6C85F]" />
                        <div className="font-bold text-lg">Top 1%</div>
                        <div className="text-[10px] opacity-80">Of performers</div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

const FeaturesStrip = () => {
    return (
        <div className="bg-white py-12 border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {FEATURES.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                            <div className="p-3 bg-indigo-50 text-[#1F2A6B] rounded-lg group-hover:bg-[#1F2A6B] group-hover:text-white transition-colors">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Courses = () => {
    return (
        <section id="courses" className="py-24 bg-[#FBFBFD]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1F2A6B] mb-4">Popular Curriculum</h2>
                        <p className="text-slate-500 max-w-md">Our courses are rigorously designed to bridge the gap between theoretical math and applied computer science.</p>
                    </div>
                    <button className="hidden md:flex text-[#14B8A6] font-bold items-center hover:gap-2 transition-all">
                        View All Courses <ChevronRight />
                    </button>
                </div>

                {/* Carousel Container */}
                <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
                    {COURSES.map((course, idx) => (
                        <motion.div
                            key={course.id}
                            whileHover={{ y: -5 }}
                            className="min-w-[300px] md:min-w-[340px] bg-white rounded-2xl shadow-lg border border-gray-100 p-6 snap-center cursor-pointer group"
                        >
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${course.color}`}>
                                {course.level}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#1F2A6B] transition-colors">{course.title}</h3>

                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                                <div className="bg-[#14B8A6] h-full rounded-full" style={{ width: `${Math.random() * 40 + 20}%` }}></div>
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Users size={16} />
                                    {course.students}
                                </div>
                                <div className="flex items-center gap-1 text-[#F6C85F] font-bold">
                                    <Star size={16} fill="currentColor" />
                                    {course.rating}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const DemoSection = () => {
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);

    const codeSnippet = `
import numpy as np

# Visualizing Sine Wave
x = np.linspace(0, 10, 100)
y = np.sin(x)
  `;

    const handleExplainCode = async () => {
        if (explanation) return; // Don't fetch again if already showing
        setLoading(true);
        try {
            const response = await callGemini(
                `Explain the mathematical concept behind this Python code briefly for a student: ${codeSnippet}`,
                "You are a math and code tutor. Explain simply."
            );
            setExplanation(response);
        } catch (e) {
            setExplanation("Could not load explanation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-24 bg-[#1F2A6B] text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold mb-6">Interactive Learning Environment</h2>
                    <p className="text-indigo-200 text-lg mb-8">
                        Don't just read about math. Visualize it. Our integrated coding environment allows you to script mathematical proofs and see the results instantly.
                    </p>
                    <ul className="space-y-4 mb-8">
                        {['Real-time plotting libraries included', 'Step-by-step logic debugger', 'Instant feedback on solutions'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="bg-[#14B8A6] rounded-full p-1">
                                    <Check size={12} strokeWidth={4} className="text-white" />
                                </div>
                                <span className="font-medium">{item}</span>
                            </li>
                        ))}
                    </ul>
                    <button className="bg-white text-[#1F2A6B] px-8 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
                        Try the Demo Lesson
                    </button>
                </div>

                {/* Browser Mockup */}
                <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-700">
                    <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                        <div className="flex gap-1.5 items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <div className="bg-gray-900 px-3 py-1 rounded text-xs text-gray-400 font-mono">math4code-lab.js</div>
                        <div className="w-10"></div> {/* Spacer */}
                    </div>
                    <div className="p-6 font-mono text-sm relative">
                        <div className="flex">
                            <div className="text-gray-500 select-none pr-4 text-right">1<br />2<br />3<br />4<br />5</div>
                            <div className="w-full">
                                <p className="text-pink-400">import <span className="text-white">numpy</span> as <span className="text-white">np</span></p>
                                <p className="text-white"><br /></p>
                                <p className="text-blue-400"># Visualizing Sine Wave</p>
                                <p className="text-white">x = np.linspace(<span className="text-orange-400">0</span>, <span className="text-orange-400">10</span>, <span className="text-orange-400">100</span>)</p>
                                <p className="text-white">y = np.sin(x)</p>
                            </div>
                        </div>

                        {/* Gemini Feature: Explain Code Button */}
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={handleExplainCode}
                                disabled={loading}
                                className="flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all border border-indigo-400/50 backdrop-blur-sm"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-[#F6C85F]" />}
                                {loading ? "Analyzing..." : "Explain with AI"}
                            </button>
                        </div>

                        {/* Animated Graph Placeholder */}
                        <div className="mt-6 bg-gray-800 h-40 rounded-lg relative overflow-hidden flex items-end px-4 pb-4">
                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <motion.path
                                    d="M0,70 C50,20 100,120 150,70 C200,20 250,120 300,70"
                                    fill="none"
                                    stroke="#14B8A6"
                                    strokeWidth="3"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                />
                            </svg>
                            <div className="absolute top-2 right-2 text-xs text-green-400 font-bold bg-green-900/30 px-2 py-1 rounded">Build Success</div>
                        </div>

                        {/* AI Explanation Result */}
                        <AnimatePresence>
                            {explanation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 bg-indigo-900/50 border border-indigo-500/30 rounded-lg text-xs text-indigo-100 leading-relaxed backdrop-blur-sm"
                                >
                                    <div className="flex items-center gap-2 mb-2 text-[#F6C85F] font-bold">
                                        <Bot size={14} /> AI Analysis
                                    </div>
                                    {explanation}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

const Testimonials = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-extrabold text-[#1F2A6B] mb-12">Success Stories</h2>

                <div className="relative min-h-[250px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5 }}
                            className="absolute w-full"
                        >
                            <div className="text-[#F6C85F] flex justify-center mb-6">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} fill="currentColor" size={24} />)}
                            </div>
                            <h3 className="text-2xl md:text-3xl font-medium text-slate-800 italic mb-6 leading-relaxed">
                                "{TESTIMONIALS[index].text}"
                            </h3>
                            <div>
                                <div className="font-bold text-[#1F2A6B] text-lg">{TESTIMONIALS[index].name}</div>
                                <div className="text-slate-500 text-sm">{TESTIMONIALS[index].role}</div>
                                <div className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {TESTIMONIALS[index].score}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                    {TESTIMONIALS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === index ? 'w-6 bg-[#1F2A6B]' : 'bg-gray-300'}`}
                            aria-label={`Go to testimonial ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

const Pricing = () => {
    return (
        <section id="pricing" className="py-24 bg-[#FBFBFD]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1F2A6B]">Simple Pricing</h2>
                    <p className="text-slate-500 mt-4">Invest in your future. 14-day money-back guarantee.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                    {/* Basic */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="font-bold text-xl text-gray-900">Basic</h3>
                        <div className="text-4xl font-extrabold text-[#1F2A6B] my-4">$0</div>
                        <p className="text-gray-500 mb-6">Forever free for basic concepts.</p>
                        <ul className="space-y-3 mb-8 text-sm text-gray-600">
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Access to 5 Courses</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Basic Python Sandbox</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Community Support</li>
                        </ul>
                        <button className="w-full py-3 rounded-lg border-2 border-[#1F2A6B] text-[#1F2A6B] font-bold hover:bg-indigo-50 transition-colors">Start Free</button>
                    </div>

                    {/* Pro */}
                    <div className="bg-[#1F2A6B] p-8 rounded-3xl shadow-2xl relative transform scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-[#F6C85F] text-[#1F2A6B] text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase">Best Value</div>
                        <h3 className="font-bold text-xl text-white">Pro Student</h3>
                        <div className="text-4xl font-extrabold text-white my-4">$19<span className="text-lg font-medium text-indigo-300">/mo</span></div>
                        <p className="text-indigo-200 mb-6">Full access to everything.</p>
                        <ul className="space-y-3 mb-8 text-sm text-indigo-100">
                            <li className="flex gap-2"><Check size={18} className="text-[#14B8A6]" /> All 40+ Premium Courses</li>
                            <li className="flex gap-2"><Check size={18} className="text-[#14B8A6]" /> Unlimited Mock Exams</li>
                            <li className="flex gap-2"><Check size={18} className="text-[#14B8A6]" /> 1-on-1 Mentor Chat</li>
                            <li className="flex gap-2"><Check size={18} className="text-[#14B8A6]" /> Advanced Analytics</li>
                        </ul>
                        <button className="w-full py-3 rounded-lg bg-[#14B8A6] text-white font-bold hover:bg-[#0d9488] shadow-lg shadow-teal-900/20 transition-all hover:-translate-y-1">Get Pro Access</button>
                    </div>

                    {/* Institution */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="font-bold text-xl text-gray-900">Institution</h3>
                        <div className="text-4xl font-extrabold text-[#1F2A6B] my-4">Custom</div>
                        <p className="text-gray-500 mb-6">For schools and coaching centers.</p>
                        <ul className="space-y-3 mb-8 text-sm text-gray-600">
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Bulk Student Licenses</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Teacher Dashboard</li>
                            <li className="flex gap-2"><Check size={18} className="text-green-500" /> Custom Syllabus Import</li>
                        </ul>
                        <button className="w-full py-3 rounded-lg border-2 border-gray-200 text-gray-600 font-bold hover:border-[#1F2A6B] hover:text-[#1F2A6B] transition-colors">Contact Sales</button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CTA = () => {
    return (
        <div className="py-20 px-6">
            <div className="max-w-5xl mx-auto bg-gradient-to-r from-[#14B8A6] to-teal-600 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <h2 className="relative z-10 text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to top the leaderboard?</h2>
                <p className="relative z-10 text-teal-50 text-lg mb-8 max-w-2xl mx-auto">Join the community of problem solvers. No credit card required for the trial.</p>
                <button className="relative z-10 bg-white text-teal-700 px-10 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all hover:scale-105">
                    Start Learning Now
                </button>
            </div>
        </div>
    );
};

const Footer = () => {
    return (
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
                        <li><a href="#" className="hover:text-[#14B8A6]">Privacy Policy</a></li>
                        <li><a href="#" className="hover:text-[#14B8A6]">Terms of Service</a></li>
                        <li><a href="#" className="hover:text-[#14B8A6]">Cookie Settings</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
                © 2024 Math4Code Inc. All rights reserved.
            </div>
        </footer>
    );
};

const AIMentor = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "Hi! I'm Newton. Ask me about our Math courses or Python series!" }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // --- Prepare Knowledge Base ---
    const knowledgeBase = JSON.stringify({
        courses: COURSES.map(c => ({ id: c.id, name: c.title, level: c.level, price: c.price })),
        exams: EXAM_SERIES.map(e => ({ id: e.id, name: e.title, questions: e.questions, price: e.price }))
    });

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMsg = query;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setQuery("");
        setLoading(true);

        try {
            const response = await callGemini(
                userMsg,
                `You are Newton, an AI sales tutor for Math4Code.
         Your Goal: Help students find the right course or exam from our catalog.
         
         Catalog Data: ${knowledgeBase}
         
         Instructions:
         1. Be helpful and encouraging.
         2. If a user asks about a topic covered by a course/exam, recommend it clearly.
         3. CRITICAL: If you recommend a specific product, you MUST end your sentence with a special tag: {{PRODUCT_ID}}. 
            Example: "You should check out our Algebra course. {{c3}}"
            Example: "For practice, try the JEE Mock Series. {{e1}}"
         4. Do not invent products not in the catalog.
         5. Keep responses concise.`
            );
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the stars right now." }]);
        } finally {
            setLoading(false);
        }
    };

    // --- Purchase Handler ---
    const handleBuy = (productId: string) => {
        const product = [...COURSES, ...EXAM_SERIES].find(p => p.id === productId);
        if (product) {
            // In a real app, this would use router.push('/checkout')
            alert(`Redirecting to payment gateway for: ${product.title} ($${product.price})`);
        }
    };

    // --- Message Renderer with Tag Parsing ---
    const renderMessageText = (text: string) => {
        // Regex to split text by {{ID}} tags
        const parts = text.split(/(\{\{[a-zA-Z0-9]+\}\})/g);

        return (
            <div className="flex flex-col gap-2">
                {parts.map((part, idx) => {
                    // Check if this part is a tag
                    if (part.match(/^\{\{[a-zA-Z0-9]+\}\}$/)) {
                        const id = part.replace(/[\{\}]/g, '');
                        const product = [...COURSES, ...EXAM_SERIES].find(p => p.id === id);

                        if (product) {
                            return (
                                <div key={idx} className="mt-2 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-[#1F2A6B] text-sm">{product.title}</div>
                                        <div className="font-bold text-[#14B8A6] text-sm">${product.price}</div>
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                        {'level' in product ? product.level : 'Exam Series'}
                                    </div>
                                    <button
                                        onClick={() => handleBuy(product.id)}
                                        className="w-full mt-1 bg-[#1F2A6B] hover:bg-indigo-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <ShoppingCart size={12} />
                                        Buy Now
                                    </button>
                                </div>
                            );
                        }
                        return null;
                    }
                    // Return regular text
                    return <span key={idx}>{part}</span>;
                })}
            </div>
        );
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-[#1F2A6B] p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/10 rounded-lg">
                                    <Bot size={20} className="text-[#F6C85F]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Newton AI</h3>
                                    <p className="text-[10px] text-indigo-200">Sales & Math Expert</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 h-[350px]">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user'
                                        ? 'bg-[#14B8A6] text-white rounded-tr-none'
                                        : 'bg-white border border-gray-200 text-slate-700 rounded-tl-none shadow-sm'
                                        }`}>
                                        {renderMessageText(msg.text)}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about math..."
                                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-[#1F2A6B] focus:ring-0 rounded-xl px-4 text-sm transition-all outline-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !query.trim()}
                                className="bg-[#1F2A6B] text-white p-2.5 rounded-xl hover:bg-indigo-900 transition-colors disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 bg-[#1F2A6B] hover:bg-indigo-900 text-white p-4 rounded-full shadow-lg shadow-indigo-900/30 transition-transform hover:scale-110 active:scale-95 group"
            >
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F6C85F] rounded-full border-2 border-white"></span>
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </>
    );
};

export default function App() {
    return (
        <div className="font-sans antialiased text-slate-900 bg-[#FBFBFD]">
            <Navbar />
            <Hero />
            <FeaturesStrip />
            <Courses />
            <DemoSection />
            <Testimonials />
            <Pricing />
            <CTA />
            <Footer />
            <AIMentor />
        </div>
    );
}