"use client";

import { createClient } from "@/lib/supabase/client";
import AdminDashboardClient from "./components/AdminDashboardClient";
import Loading from "./components/Loading";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

async function fetchUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user?.id ?? null;
}

export default function AdminDashboardPage() {
  const { data: userId, isLoading, isError, error } = useQuery({
    queryKey: ["auth-user-id"],
    queryFn: fetchUserId,
    staleTime: 1000 * 60 * 5, // cache 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Loading />;
  if (isError) {
    console.error(error);
    return (
      <div className="flex items-center justify-center h-[70vh] text-red-500">
        Failed to load user information.
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-[70vh] text-gray-500">
        No active session found. Please login again.
      </div>
    );
  }

  return <AdminDashboardClient userId={userId} />;
}
