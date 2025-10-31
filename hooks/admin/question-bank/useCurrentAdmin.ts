"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const useCurrentAdmin = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["current-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data?.user?.id ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
};
