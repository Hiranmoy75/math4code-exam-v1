import { NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js"; // Removed manual init
import { createClient } from "@/lib/supabase/server"; // For fallback
import { createAdminClient } from "@/lib/supabase/admin";
import { checkPaymentStatus } from "@/lib/phonepe";

// Shared logic for processing redirect (POST or GET)
async function processRedirect(req: Request, transactionId: string) {
  try {
    let supabase;
    try {
      // Try to use Admin Client for RLS bypass
      supabase = createAdminClient();
    } catch (e) {
      console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY missing. Falling back to standard client (Enrollment may fail due to RLS).");
      supabase = await createClient();
    }
    // Check payment status from PhonePe
    const statusResponse = await checkPaymentStatus(transactionId);
    const state = statusResponse.state;
    let status = "pending";
    if (state === "COMPLETED" || state === "PAYMENT_SUCCESS") status = "success";
    else if (state === "FAILED" || state === "PAYMENT_ERROR" || state === "PAYMENT_DECLINED") status = "failed";

    // Update DB - Try updating course_payments first
    const { data: payment } = await supabase
      .from("course_payments")
      .update({ status: status, metadata: statusResponse })
      .eq("transaction_id", transactionId)
      .select()
      .single();

    // If not found in course_payments, try payments (for test   series)
    let userId = payment?.user_id;
    let courseId = payment?.course_id;
    let seriesId = null;

    if (!payment) {
      const { data: tsPayment } = await supabase
        .from("payments")
        .update({ status: status })
        .eq("phonepe_transaction_id", transactionId)
        .select()
        .single();

      if (tsPayment) {
        userId = tsPayment.user_id;
        seriesId = tsPayment.series_id;
      }
    }

    // Activate Enrollment if success
    if (status === "success" && userId) {
      if (courseId) {
        // Course Enrollment
        const { data: existingEnrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .single();

        if (!existingEnrollment) {
          const { error: enrollError } = await supabase.from("enrollments").insert({
            user_id: userId,
            course_id: courseId,
            status: "active",
            payment_id: payment?.id,
            enrolled_at: new Date().toISOString(),
            progress: 0
          });
          if (enrollError) console.error("❌ Redirect Enrollment Insert Failed:", enrollError);
        } else {
          const { error: updateError } = await supabase.from("enrollments").update({
            status: "active",
            payment_id: payment?.id
          }).eq("id", existingEnrollment.id);
          if (updateError) console.error("❌ Redirect Enrollment Update Failed:", updateError);
        }
      } else if (seriesId) {
        // Test Series Enrollment
        const { data: existingEnrollment } = await supabase
          .from("test_series_enrollments")
          .select("id")
          .eq("student_id", userId)
          .eq("test_series_id", seriesId)
          .single();

        if (!existingEnrollment) {
          await supabase.from("test_series_enrollments").insert({
            student_id: userId,
            test_series_id: seriesId,
            enrolled_at: new Date().toISOString()
          });
        }
      }
    }

    // Redirect based on determined status
    if (status === "success" || status === "pending") {
      return NextResponse.redirect(new URL(`/student/payment/verify?txnId=${transactionId}`, req.url), 303);
    } else {
      return NextResponse.redirect(new URL(`/student/payment/verify?txnId=${transactionId}&error=failed`, req.url), 303);
    }

  } catch (error: any) {
    console.error("Redirect Error:", error);
    return NextResponse.redirect(new URL(`/student/dashboard?error=payment_error`, req.url), 303);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    // console.log("Redirect POST FormData:", Object.fromEntries(formData));
    const transactionId = (formData.get("transactionId") || formData.get("merchantOrderId") || formData.get("merchantTransactionId") || formData.get("code")) as string;

    // PhonePe sometimes sends 'code' and 'merchantId' but maybe 'transactionId' is named differently or missing?
    // If we only get code/merchantId, we might need to rely on the session or something else, but usually transactionId is there.

    if (transactionId) {
      return processRedirect(req, transactionId);
    }
    console.error("Missing transactionId in POST");
    return NextResponse.redirect(new URL(`/student/dashboard?error=invalid_redirect_post_missing_id`, req.url), 303);
  } catch (e) {
    console.error("Error parsing POST formData:", e);
    return NextResponse.redirect(new URL(`/student/dashboard?error=invalid_redirect_post_error`, req.url), 303);
  }
}

export async function GET(req: Request) {
  console.log("Redirect GET received");
  const { searchParams } = new URL(req.url);
  console.log("Redirect GET Params:", Object.fromEntries(searchParams));

  const transactionId = searchParams.get("transactionId") || searchParams.get("merchantTransactionId") || searchParams.get("merchantOrderId");

  if (transactionId) {
    return processRedirect(req, transactionId);
  }
  console.error("Missing transactionId in GET");
  return NextResponse.redirect(new URL(`/student/dashboard?error=invalid_redirect`, req.url), 303);
}
