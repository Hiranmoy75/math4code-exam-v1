// hooks/admin/useAdminDashboard.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

type DashboardData = {
  totals: {
    students: number;
    questions: number;
    test_series: number;
    results: number;
  };
  recentUsers: Array<{ id: string; full_name?: string | null; email: string }>;
  recentTests: Array<any>;
  // You can extend this structure as your DB provides more fields (avg scores etc.)
};

const supabase = createClient();

async function fetchDashboard(): Promise<DashboardData> {
  // Fetch totals (use select with count exact — supabase supports { count: 'exact' })
  const totals: DashboardData['totals'] = {
    students: 0,
    questions: 0,
    test_series: 0,
    results: 0,
  };

  // profiles count (students)
  const profilesResp = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: false })
    .eq('role', 'student');
  if (profilesResp.error) throw profilesResp.error;
  totals.students = (profilesResp.count ?? 0) as number;

  // questions count
  const qResp = await supabase.from('questions').select('id', { count: 'exact' });
  if (!qResp.error) totals.questions = (qResp.count ?? 0) as number;

  // test_series count
  const tsResp = await supabase.from('test_series').select('id', { count: 'exact' });
  if (!tsResp.error) totals.test_series = (tsResp.count ?? 0) as number;

  // results count
  const rResp = await supabase.from('results').select('id', { count: 'exact' });
  if (!rResp.error) totals.results = (rResp.count ?? 0) as number;

  // recent users (last 6)
  const recentUsersResp = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(6);

  if (recentUsersResp.error) throw recentUsersResp.error;
  const recentUsers = recentUsersResp.data ?? [];

  // recent tests (test_series) (last 6)
  const recentTestsResp = await supabase
    .from('test_series')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  if (recentTestsResp.error) throw recentTestsResp.error;
  const recentTests = recentTestsResp.data ?? [];

  return {
    totals,
    recentUsers,
    recentTests,
  };
}

/**
 * Hook: useAdminDashboard
 * - caches results with a comfortable staleTime
 * - refetches in background on window focus only if stale
 */
export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
