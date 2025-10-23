"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { MultiStepLoader as Loader } from "@/components/ui/multi-step-loader";
import { createClient } from "@/lib/supabase/client";
import { LoaderFive } from "@/components/ui/loader";

const loadingStates = [
  { text: "Verifying student credentials..." },
  { text: "Checking exam eligibility..." },
  { text: "Loading exam interface..." },
  { text: "Preparing answer sheet..." },
  { text: "Initializing timer..." },
  { text: "Finalizing setup..." },
  { text: "Starting your exam..." },
];

function DashboardContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const totalDuration = loadingStates.length * 800;

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRedirectPath("/auth/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") setRedirectPath("/admin/dashboard");
        else setRedirectPath("/student/dashboard");
      } catch (error) {
        console.error("Error fetching profile:", error);
        setRedirectPath("/auth/login");
      }
    };

    fetchUser();
  }, []);

  // This will synchronize both the loader and Supabase readiness
  useEffect(() => {
    if (!redirectPath) return;

    const timer = setTimeout(() => {
      setLoading(false);
      // Small delay before redirect to prevent white flash
      setTimeout(() => {
        router.replace(redirectPath);
      }, 100); // 100ms to ensure DOM unmount smoothly
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [redirectPath, router, totalDuration]);

  // If loading is false but redirect hasn't happened yet → show "Preparing" fallback
  if (!loading && redirectPath) {
    return (
     
       <LoaderFive text="Preparing your dashboard..." />
     
    );
  }

  return (
    <Loader
      loadingStates={loadingStates}
      loading={loading}
      duration={900}
    />
  );
}

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white">
      <Suspense
        fallback={
            <LoaderFive text="Preparing your dashboard..." />       
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
