import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const transactionId = formData.get("transactionId") as string;
    const code = formData.get("code");

    // Note: PhonePe redirect sends data as form-data
    // We should verify checksum here too, but for redirect it's less critical than callback
    // as we can double check status with DB or API.

    const supabase = await createClient();

    // Check if payment is already marked as success (by callback)
    const { data: payment } = await supabase
      .from("course_payments")
      .select("status")
      .eq("transaction_id", transactionId)
      .single();

    if (payment?.status === "success") {
      return NextResponse.redirect(new URL(`/student/payment/verify?txnId=${transactionId}`, req.url), 303);
    }

    // If not success yet, we rely on the code param
    if (code === "PAYMENT_SUCCESS") {
      // We can optimistically redirect to success, the verify page will poll/check status
      return NextResponse.redirect(new URL(`/student/payment/verify?txnId=${transactionId}`, req.url), 303);
    } else {
      return NextResponse.redirect(new URL(`/student/payment/verify?txnId=${transactionId}&error=failed`, req.url), 303);
    }

  } catch (error: any) {
    console.error("Redirect Error:", error);
    return NextResponse.redirect(new URL(`/student/dashboard?error=payment_error`, req.url), 303);
  }
}

// Handle GET requests (in case PhonePe sends GET or user refreshes)
export async function GET(req: Request) {
  // For GET, params are in the URL search params, not body
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId") || searchParams.get("merchantTransactionId");

  if (transactionId) {
    return NextResponse.redirect(new URL(`/student/payment/verify?txnId=${transactionId}`, req.url), 303);
  }

  return NextResponse.redirect(new URL(`/student/dashboard?error=invalid_redirect`, req.url), 303);
}
