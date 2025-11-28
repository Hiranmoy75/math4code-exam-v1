import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const adminSupabase = createAdminClient();
        const { data: profile } = await adminSupabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";

        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        let query = adminSupabase
            .from("payments")
            .select(
                `
        *,
        test_series (title)
      `,
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(start, end);

        if (search) {
            query = query.ilike("phonepe_transaction_id", `%${search}%`);
        }

        const { data: payments, error: paymentsError, count } = await query;

        if (paymentsError) {
            console.error("Error fetching test series payments:", paymentsError);
            return NextResponse.json({ error: paymentsError.message }, { status: 500 });
        }

        if (!payments || payments.length === 0) {
            return NextResponse.json({ data: [], count: 0 });
        }

        const userIds = Array.from(new Set(payments.map((p) => p.user_id)));

        const { data: profiles, error: profilesError } = await adminSupabase
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
        }

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

        return NextResponse.json({ data: processedData, count: count || 0 });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
