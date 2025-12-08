"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminClientLayout from "../admin/AdminClientLayout";
import { CommunityModalProvider } from "@/context/CommunityModalContext";
import { CommunityModal } from "@/components/community/CommunityModal";
import { useCurrentUser } from "@/hooks/student/useCurrentUser";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: profile, isLoading } = useCurrentUser();

  useEffect(() => {
    // Only redirect if we have definitively finished loading and there is no user,
    // or if the user is not a student.
    if (!isLoading) {
      if (!profile) {
        router.replace("/auth/login");
      } else if (profile.role !== "student") {
        router.replace("/admin/dashboard");
      }
    }
  }, [profile, isLoading, router]);

  const links = [
    { icon: "home", label: "Dashboard", href: "/student/dashboard" },
    { icon: "bookopen", label: "My Courses", href: "/student/dashboard?tab=my-courses" },
    { icon: "layers", label: "All Courses", href: "/student/dashboard?tab=all-courses" },
    { icon: "messagesquare", label: "Community", href: "#", onClick: "openCommunity" },
    { icon: "trendingup", label: "My Series", href: "/student/my-series" },
    { icon: "award", label: "Result", href: "/student/results" },
    { icon: "gift", label: "Rewards", href: "/student/rewards" },
    { icon: "layers", label: "All Series", href: "/student/all-test-series" },
    { icon: "settings", label: "Settings", href: "/student/settings" },
  ];

  // If loading and NO data (initial fetch), show loading.
  // If we have cached data, we skip this and render immediately.
  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        {/* Optional: Add a spinner here if desired, but text is fine */}
        Checking access...
      </div>
    );
  }

  // If not loading but no profile (will redirect in effect), allow render or return null to prevent flash
  if (!profile) return null;

  // Adapt the profile object for AdminClientLayout if necessary
  const layoutProfile = {
    id: profile.id,
    full_name: profile.fullName,
    email: profile.email,
    role: profile.role,
    avatar_url: null, // useCurrentUser might not fetch avatar_url, add if needed
  };

  return (
    <CommunityModalProvider>
      <AdminClientLayout profile={layoutProfile} links={links}>
        {children}
      </AdminClientLayout>
      <CommunityModal />
    </CommunityModalProvider>
  );
}
