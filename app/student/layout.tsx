"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminClientLayout from "../admin/AdminClientLayout";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !profileData) {
        router.replace("/auth/login");
        return;
      }

      if (profileData.role !== "student") {
        router.replace("/admin/dashboard");
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    checkAuth();
  }, [router, supabase]);

  const links = [
    { icon: "home", label: "Dashboard", href: "/student/dashboard" },
    { icon: "bookopen", label: "My Courses", href: "/student/dashboard?tab=my-courses" },
    { icon: "layers", label: "All Courses", href: "/student/dashboard?tab=all-courses" },
    { icon: "messagesquare", label: "Community", href: "/student/community" },
    { icon: "trendingup", label: "My Series", href: "/student/my-series" },
    { icon: "award", label: "Result", href: "/student/results" },
    { icon: "gift", label: "Rewards", href: "/student/rewards" },
    { icon: "layers", label: "All Series", href: "/student/all-test-series" },
    { icon: "settings", label: "Settings", href: "/student/settings" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Checking student access...
      </div>
    );
  }

  return (
    <AdminClientLayout profile={profile} links={links}>
      {children}
    </AdminClientLayout>
  );
}
