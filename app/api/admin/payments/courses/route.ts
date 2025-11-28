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

        // Parse query params
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";

        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        // Fetch payments using admin client
        let query = adminSupabase
            .from("course_payments")
            .select(
                `
        *,
        courses (title),
        enrollments (status)
      `,
                { count: "exact" }
            )
            .order("created_at", { ascending: false })
            .range(start, end);

        if (search) {
            query = query.ilike("transaction_id", `%${search}%`);
        }

        const { data: payments, error: paymentsError, count } = await query;

        if (paymentsError) {
            console.error("Error fetching course payments:", paymentsError);
            return NextResponse.json({ error: paymentsError.message }, { status: 500 });
        }

        if (!payments || payments.length === 0) {
            return NextResponse.json({ data: [], count: 0 });
        }

        // Fetch profiles manually
        const userIds = Array.from(new Set(payments.map((p) => p.user_id)));
        const { data: profiles, error: profilesError } = await adminSupabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
        }

        const profilesMap = new Map(profiles?.map((p) => [p.id, p]));

        const mergedData = payments.map((p) => ({
            ...p,
            profiles: profilesMap.get(p.user_id) || null,
        }));

        return NextResponse.json({ data: mergedData, count: count || 0 });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
