import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type TestSeriesPayment = {
    id: string;
    user_id: string;
    series_id: string;
    amount: number;
    phonepe_transaction_id: string | null;
    status: string;
    created_at: string;
    profiles: {
        full_name: string | null;
        email: string;
    } | null;
    test_series: {
        title: string;
    } | null;
    test_series_enrollments: {
        id: string;
    }[];
    hasAccess: boolean;
};

type UseTestSeriesPaymentsOptions = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export const useTestSeriesPayments = ({
    page = 1,
    pageSize = 10,
    search = "",
}: UseTestSeriesPaymentsOptions = {}) => {
    return useQuery({
        queryKey: ["admin", "test-series-payments", page, pageSize, search],
        queryFn: async () => {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;

            // 0. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // 1. Fetch payments with test_series info
            // Filter by admin_id using inner join on test_series
            let query = supabase
                .from("payments")
                .select(
                    `
          *,
          test_series!inner (title, admin_id)
        `,
                    { count: "exact" }
                )
                .eq("test_series.admin_id", user.id)
                .order("created_at", { ascending: false })
                .range(start, end);

            if (search) {
                query = query.ilike("phonepe_transaction_id", `%${search}%`);
            }

            const { data: payments, error: paymentsError, count } = await query;

            if (paymentsError) {
                console.error("Error fetching test series payments:", paymentsError);
                throw paymentsError;
            }

            if (!payments || payments.length === 0) {
                return { data: [], count: 0 };
            }

            // 2. Fetch profiles AND their enrollments for these users
            const userIds = Array.from(new Set(payments.map((p) => p.user_id)));

            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select(`
          id, 
          full_name, 
          email,
          test_series_enrollments (test_series_id)
        `)
                .in("id", userIds);

            if (profilesError) {
                console.error("Error fetching profiles:", profilesError);
            } else {
                console.log(`[useTestSeriesPayments] Fetched ${profiles?.length} profiles for ${userIds.length} unique users.`);
                if (profiles?.length === 0 && userIds.length > 0) {
                    console.warn("[useTestSeriesPayments] Profiles empty despite having userIds. RLS blocking?");
                }
            }

            // 3. Merge data and check access
            const profilesMap = new Map(profiles?.map((p) => [p.id, p]));

            const processedData = payments.map((payment) => {
                const profile = profilesMap.get(payment.user_id);
                const enrollments = profile?.test_series_enrollments || [];

                const hasAccess = enrollments.some(
                    (e: any) => e.test_series_id === payment.series_id
                );

                return {
                    ...payment,
                    profiles: profile ? { full_name: profile.full_name, email: profile.email } : null,
                    hasAccess,
                };
            });

            return {
                data: processedData as (TestSeriesPayment & { hasAccess: boolean })[],
                count: count || 0,
            };
        },
        placeholderData: (previousData) => previousData,
    });
};
