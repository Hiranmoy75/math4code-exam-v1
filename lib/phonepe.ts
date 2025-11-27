import { StandardCheckoutClient, Env, MetaInfo, StandardCheckoutPayRequest } from 'pg-sdk-node';

// Environment Variables
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "M232JQ16HLYZR";
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || "M232JQ16HLYZR_2511190912";
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || "NGVhNmJmYWQtNWQxMC00OWFlLTk5YjQtYzQ4Yzg0ZjAyOTdm";
const CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION || "1");
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
const PHONEPE_ENV = process.env.PHONEPE_ENV === "prod" ? Env.PRODUCTION : Env.SANDBOX;

// Initialize PhonePe Client
const client = StandardCheckoutClient.getInstance(
  CLIENT_ID,
  CLIENT_SECRET,
  CLIENT_VERSION,
  PHONEPE_ENV
);

/**
 * Initiate Payment using Standard Checkout API (v2) via pg-sdk-node
 */
export async function createPayment(orderId: string, amount: number) {
  try {
    const redirectUrl = `${DOMAIN}/api/phonepe/redirect?transactionId=${orderId}`;
    const callbackUrl = `${DOMAIN}/api/phonepe/callback`;

    // Create MetaInfo (Optional but good for tracking)
    const metaInfo = MetaInfo.builder()
      .udf1("course_purchase")
      .build();

    // Build Request
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(orderId)
      .amount(amount * 100) // Convert to paise
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    // Manually add missing fields that might be required
    (request as any).merchantUserId = "user_123";
    // deviceContext removed as it causes "WEB" enum error (only IOS/ANDROID allowed)

    console.log("🚀 Initiating Payment (SDK)...");
    console.log("Request Payload:", JSON.stringify(request, null, 2));

    const response = await client.pay(request);

    console.log("✅ Payment Initiated Successfully:", response);

    return {
      success: true,
      data: {
        redirectUrl: response.redirectUrl
      }
    };

  } catch (error: any) {
    console.error("❌ PhonePe Payment Initiation Error:", error);
    return {
      success: false,
      error: error.message || "Payment initiation failed",
      details: error
    };
  }
}

/**
 * Check Payment Status using Standard Checkout API (v2) via SDK
 */
export async function checkPaymentStatus(orderId: string) {
  try {
    console.log("🔄 Checking Payment Status (SDK)...");
    console.log("Order ID:", orderId);

    const response = await client.getTransactionStatus(orderId);

    console.log("✅ Payment Status Response:", JSON.stringify(response, null, 2));
    return response;

  } catch (error: any) {
    console.error("❌ PhonePe Status Check Error:", error.message);
    return { success: false, error: error.message, state: "FAILED" };
  }
}
