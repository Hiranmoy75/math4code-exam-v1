import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type CoursePayment = {
    id: string;
    user_id: string;
    course_id: string;
    amount: number;
    transaction_id: string;
    status: string;
    created_at: string;
    profiles: {
        id: string;
        full_name: string | null;
        email: string;
    } | null;
    courses: {
        title: string;
    } | null;
    enrollments: {
        status: string;
    }[];
};

type UseCoursePaymentsOptions = {
    page?: number;
    pageSize?: number;
    search?: string;
};

export const useCoursePayments = ({
    page = 1,
    pageSize = 10,
    search = "",
}: UseCoursePaymentsOptions = {}) => {
    return useQuery({
        queryKey: ["admin", "course-payments", page, pageSize, search],
        queryFn: async () => {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;

            // 0. Get current user
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // 1. Fetch payments with courses and enrollments
            // Filter by creator_id using inner join on courses
            let query = supabase
                .from("course_payments")
                .select(
                    `
          *,
          courses!inner (title, creator_id),
          enrollments (status)
        `,
                    { count: "exact" }
                )
                .eq("courses.creator_id", user.id)
                .order("created_at", { ascending: false })
                .range(start, end);

            if (search) {
                query = query.ilike("transaction_id", `%${search}%`);
            }

            const { data: payments, error: paymentsError, count } = await query;

            if (paymentsError) {
                console.error("Error fetching course payments:", paymentsError);
                throw paymentsError;
            }

            if (!payments || payments.length === 0) {
                return { data: [], count: 0 };
            }

            // 2. Fetch profiles for these users manually
            const userIds = Array.from(new Set(payments.map((p) => p.user_id)));
            const { data: profiles, error: profilesError } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .in("id", userIds);

            if (profilesError) {
                console.error("Error fetching profiles:", profilesError);
            } else {
                console.log(
                    `[useCoursePayments] Fetched ${profiles?.length} profiles for ${userIds.length} unique users.`
                );
                if (profiles?.length === 0 && userIds.length > 0) {
                    console.warn(
                        "[useCoursePayments] Profiles empty despite having userIds. RLS blocking?"
                    );
                }
            }

            // 3. Merge data
            const profilesMap = new Map(profiles?.map((p) => [p.id, p]));

            const mergedData = payments.map((p) => ({
                ...p,
                profiles: profilesMap.get(p.user_id) || null,
            }));

            return {
                data: mergedData as CoursePayment[],
                count: count || 0,
            };
        },
        placeholderData: (previousData) => previousData,
    });
};
