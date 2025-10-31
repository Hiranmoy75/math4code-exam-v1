"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export type Profile = {
  id: string;
  email: string;
  role: 'student' | 'admin';
  full_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  avatar_url?: string | null;
};

/**
 * Fetch the current logged-in student's profile.
 */
export const fetchProfile = async (): Promise<Profile | null> => {
  const supabase = createClient();

  // ✅ Correct destructuring for Supabase v2
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as Profile;
};

/**
 * React Query hook to get student profile.
 */
export const useProfileQuery = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 15, // 15 mins
    placeholderData: (previousData) => previousData, // keeps previous on refetch -> no UI flash
    retry: 1,
  });
};

/**
 * Update student profile (partial update).
 */
export const updateProfile = async (payload: Partial<Profile>) => {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) throw new Error('User not found');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
};

/**
 * React Query mutation hook for updating profile.
 */
export const useUpdateProfileMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // ✅ React Query v5 format
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
