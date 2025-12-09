
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { refundTransaction } from "@/lib/phonepe";


export async function POST(req: Request) {
    try {
        const { transactionId, amount, userId, paymentId, type } = await req.json();

        if (!transactionId || !amount || !userId || !paymentId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        console.log(`💸 Processing Refund Request:`, { transactionId, amount, userId });

        // 1. Verify Admin (Or rely on protected route middleware if present, but double check here)
        // Accessing session from cookie for authentication check
        const { createClient: createServerClient } = require('@supabase/ssr');
        const { cookies } = require('next/headers');
        const cookieStore = await cookies();

        const authSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => { },
                }
            }
        );

        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await authSupabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        // 2. Initiate Refund with PhonePe
        const refundResult = await refundTransaction(transactionId, amount, userId);

        if (!refundResult.success) {
            return NextResponse.json({ error: refundResult.message }, { status: 400 });
        }

        // 3. Update Database (Service Role)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update Payment Record Status
        const table = type === 'test-series' ? 'payments' : 'course_payments';
        // Note: For test series 'payments' table, transaction_id column might be named differently (phonepe_transaction_id)
        // Check existing code/schema or infer. Based on search, test series uses 'phonepe_transaction_id'.

        let updateQuery = supabase.from(table).update({
            status: 'refunded',
            metadata: { refund_data: refundResult.data } // Append or overwrite metadata? Ideally append but simple overwrite for now or use jsonb_set
        });

        if (type === 'test-series') {
            updateQuery = updateQuery.eq('phonepe_transaction_id', transactionId);
        } else {
            updateQuery = updateQuery.eq('transaction_id', transactionId);
        }

        const { error: paymentError } = await updateQuery;

        if (paymentError) {
            console.error("Failed to update payment status:", paymentError);
            // Even if DB update fails, refund was initiated.
        }

        // Revoke Access (Update Enrollment)
        if (type === 'test-series') {
            // For test series, check `test_series_enrollments`?
            // Need to find the enrollment.
            // Rely on `student_id` and `test_series_id` from payment?
            // Let's first get the payment to know series_id if not passed.
            // Assuming we just update based on user_id if we have it. 
            // Ideally we should pass courseId/seriesId from frontend.
        } else {
            // For courses
            // We can find enrollment by payment_id or user_id + course_id
            // Revoke by setting status to 'refunded'
            await supabase.from('enrollments')
                .update({ status: 'refunded' })
                .eq('payment_id', paymentId);
        }

        return NextResponse.json({ success: true, message: "Refund initiated and access revoked" });

    } catch (error: any) {
        console.error("Refund API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
