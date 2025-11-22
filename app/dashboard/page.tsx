"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderFive } from "@/components/ui/loader";
import { useUserRole } from "@/hooks/useUserRole";

export default function DashboardPage() {
  const router = useRouter();
  const { data: role, isLoading } = useUserRole();

  useEffect(() => {
    if (!isLoading) {
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (role === "student") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/auth/login");
      }
    }
  }, [role, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen w-full bg-white">
      <LoaderFive text="Preparing your dashboard..." />
    </div>
  );
}
