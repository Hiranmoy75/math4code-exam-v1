"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronRight, Check, Star, Play,
  BookOpen, Code, Shield, Trophy, ArrowRight,
  Calculator, Terminal, GraduationCap, Users,
  Sparkles, MessageSquare, Send, Loader2, Bot,
  ShoppingCart, CreditCard, FileText
} from 'lucide-react';
import { usePublicCourses } from '@/hooks/usePublicCourses';
import { usePublicTestSeries } from '@/hooks/usePublicTestSeries';
import { useRouter } from "next/navigation";
import { Header } from '@/components/landing/Header';
import { callGemini } from '@/components/landing/AIMentor';
import { CourseThumbnail } from "@/components/ui/CourseThumbnail";

// --- 1. Supabase Interfaces (As provided) ---

export interface PublicCourse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  creator_id: string;
  profiles?: {
    full_name: string;
  };
}

export interface PublicTestSeries {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  created_at: string;
  creator_id: string;
}

// --- 2. Mock Data (Matching Supabase Schema) ---
// In production, this data comes from your DB. We use this to simulate the fetch here.



// --- 4. API Helper & Theme ---
const COLORS = {
  primary: '#1F2A6B', // Deep Indigo
  accent1: '#14B8A6', // Vibrant Teal
  accent2: '#F6C85F', // Warm Gold
  bg: '#FBFBFD',      // Off-white
  text: '#374151',    // Slate Grey
};

const TESTIMONIALS = [
  { id: 1, name: 'Aarav P.', role: 'JEE Aspirant', text: "The adaptive practice problems changed the game for me. I finally understood where my logic was breaking down.", score: 'JEE Rank 452' },
  { id: 2, name: 'Sarah L.', role: 'CS Undergrad', text: "Math4Code bridges the gap between abstract math and actual coding. The Python visualization tool is genius.", score: 'A+ in Algorithms' },
  { id: 3, name: 'Rahul K.', role: 'High School Student', text: "The mock exams are actually harder than the real thing, which made the actual exam feel like a breeze.", score: '99.8 Percentile' },
];




// --- Components ---

const Logo = () => (
  <div className="flex items-center gap-2 font-bold text-2xl tracking-tight text-[#1F2A6B]">
    <div className="relative flex items-center justify-center w-auto px-2 h-10 rounded-lg bg-[#1F2A6B] text-white">
      <span className="text-lg">Σ✨{'}'}</span>
    </div>
    <span>Math4Code</span>
  </div>
);


const Hero = () => {
  return (
    <section className="relative pt-6 pb-20 lg:pt-8 lg:pb-32 overflow-hidden bg-[#FBFBFD]">
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
  const features = [
    { icon: <Calculator className="w-6 h-6" />, title: "Adaptive Math", desc: "Problems that get harder as you get smarter." },
    { icon: <Terminal className="w-6 h-6" />, title: "Live Coding", desc: "Run Python and JS directly in the browser." },
    { icon: <Shield className="w-6 h-6" />, title: "Secure Exams", desc: "Anti-cheat proctoring for serious mock tests." },
    { icon: <Users className="w-6 h-6" />, title: "Live Mentoring", desc: "Instant doubt resolution from top tutors." },
  ];

  return (
    <div className="bg-white py-12 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="p-3 bg-indigo-50 text-[#1F2A6B] rounded-lg group-hover:bg-[#1F2A6B] group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CourseCard = ({ course }: { course: PublicCourse }) => {
  // Helpers for visual variation since we might have null thumbnails
  const colors = {
    'University': 'bg-blue-100 text-blue-800',
    'Beginner': 'bg-teal-100 text-teal-800',
    'High School': 'bg-orange-100 text-orange-800',
    'Advanced': 'bg-purple-100 text-purple-800'
  };
  const badgeColor = colors[course.category as keyof typeof colors] || 'bg-gray-100 text-gray-800';

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="min-w-[300px] md:min-w-[340px] bg-white rounded-2xl shadow-lg border border-gray-100 p-6 snap-center cursor-pointer group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
          {course.category || 'Course'}
        </div>
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <CourseThumbnail
            src={course.thumbnail_url}
            title={course.title}
            category={course.category || "Course"}
            className="w-full h-full"
          />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#1F2A6B] transition-colors">{course.title}</h3>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{course.description}</p>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
        <div className="bg-[#14B8A6] h-full rounded-full" style={{ width: '0%' }}></div>
      </div>

      <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2 text-slate-600">
          <Users size={16} />
          <span>{course.profiles?.full_name || 'Instructor'}</span>
        </div>
        <div className="font-bold text-[#1F2A6B] text-lg">
          ${course.price}
        </div>
      </div>
    </motion.div>
  );
};

const ExamCard = ({ test }: { test: PublicTestSeries }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-[#1F2A6B] transition-all group relative">
      <div className="absolute top-4 right-4 bg-indigo-50 p-2 rounded-lg text-[#1F2A6B]">
        <FileText size={20} />
      </div>
      <h3 className="font-bold text-lg text-gray-900 pr-10">{test.title}</h3>
      <p className="text-sm text-slate-500 mt-2 mb-4 line-clamp-2">{test.description}</p>

      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-4">
        <span>Created: {new Date(test.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex justify-between items-center mt-auto">
        <div className="text-xl font-bold text-[#1F2A6B]">${test.price}</div>
        <button className="text-[#14B8A6] font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
          View Details <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

const CoursesSection = () => {
  const { data: courses, isLoading } = usePublicCourses();

  return (
    <section id="courses" className="py-24 bg-[#FBFBFD]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1F2A6B] mb-4">Popular Curriculum</h2>
            <p className="text-slate-500 max-w-md">Comprehensive courses fetched directly from our catalog.</p>
          </div>
          <button className="hidden md:flex text-[#14B8A6] font-bold items-center hover:gap-2 transition-all">
            View All Courses <ChevronRight />
          </button>
        </div>

        {isLoading ? (
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[300px] h-[300px] bg-white rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
            {courses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const ExamSeriesSection = () => {
  const { data: tests, isLoading } = usePublicTestSeries();

  return (
    <section id="exams" className="py-20 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-[#1F2A6B]">Exam Series</h2>
          <p className="text-slate-500 mt-2">Specialized mock tests for competitive programming and math.</p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests?.map((test) => (
              <ExamCard key={test.id} test={test} />
            ))}
          </div>
        )}
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







export default function App() {
  return (
    <div className="font-sans antialiased text-slate-900 bg-[#FBFBFD]">
      <Hero />
      <FeaturesStrip />
      <CoursesSection />
      <ExamSeriesSection />
      <DemoSection /><Testimonials />
      <Pricing />
      <CTA />


    </div>
  );
}