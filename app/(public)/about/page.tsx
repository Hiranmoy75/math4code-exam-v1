"use client";

import React from "react";
import { Header } from "@/components/landing/Header";
import { CheckCircle2, Users, Trophy, Target } from "lucide-react";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white text-slate-900">


            {/* Hero Section */}
            <div className="pt-32 pb-20 px-6 bg-slate-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                        Empowering the Next Generation of Developers
                    </h1>
                    <p className="text-xl text-slate-600">
                        Math4Code is a premium learning platform designed to help students master mathematics and coding concepts through interactive exams and comprehensive courses.
                    </p>
                </div>
            </div>

            {/* Mission Section */}
            <div className="py-20 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            We believe that quality education should be accessible, engaging, and effective. Our mission is to bridge the gap between theoretical knowledge and practical application by providing a platform where students can test their skills, track their progress, and achieve their academic goals.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Comprehensive Exam Preparation",
                                "Expert-Led Courses",
                                "Real-time Performance Analytics",
                                "Community of Learners"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                    <span className="font-medium text-slate-700">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-indigo-50 p-6 rounded-2xl text-center">
                            <Users className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-slate-900">10k+</div>
                            <div className="text-sm text-slate-600">Students</div>
                        </div>
                        <div className="bg-violet-50 p-6 rounded-2xl text-center">
                            <Trophy className="w-8 h-8 text-violet-600 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-slate-900">500+</div>
                            <div className="text-sm text-slate-600">Exams</div>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl text-center col-span-2">
                            <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-slate-900">95%</div>
                            <div className="text-sm text-slate-600">Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    );
}
