/* app/(public)/page.tsx */
"use client";

import React from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { FeaturesGrid } from "@/components/landing/Features";
import { MagicSection } from "@/components/landing/MagicSection";
import { StatsSection } from "@/components/landing/Stats";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header />
      <Hero />
      <FeaturesGrid />
      <MagicSection />
      <StatsSection />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
