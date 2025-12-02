import { StandardCheckoutClient, Env, MetaInfo, StandardCheckoutPayRequest } from 'pg-sdk-node';

// Environment Variables
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || MERCHANT_ID; // Default to Merchant ID if Client ID is not set
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION || "1");
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
const PHONEPE_ENV = process.env.PHONEPE_ENV === "prod" ? Env.PRODUCTION : Env.SANDBOX;

// Validation
if (!MERCHANT_ID || !CLIENT_SECRET) {
  console.error("❌ PhonePe Error: Missing Required Environment Variables (MERCHANT_ID or CLIENT_SECRET)");
}

console.log("💳 Initializing PhonePe Client...");
console.log("   - Env:", process.env.PHONEPE_ENV);
console.log("   - Merchant ID:", MERCHANT_ID);
console.log("   - Client ID:", CLIENT_ID);
console.log("   - Domain:", DOMAIN);

// Initialize PhonePe Client
const client = StandardCheckoutClient.getInstance(
  CLIENT_ID || "MISSING_CLIENT_ID",
  CLIENT_SECRET || "MISSING_CLIENT_SECRET",
  CLIENT_VERSION,
  PHONEPE_ENV
);

/**
 * Initiate Payment using Standard Checkout API (v2) via pg-sdk-node
 */
export async function createPayment(orderId: string, amount: number, userId: string) {
  try {
    const redirectUrl = `${DOMAIN}/api/phonepe/redirect?transactionId=${orderId}`;
    const callbackUrl = `${DOMAIN}/api/phonepe/callback`;

    // Create MetaInfo
    const metaInfo = MetaInfo.builder()
      .udf1("course_purchase")
      .udf2(userId)
      .build();

    // Build Request
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(orderId)
      .amount(amount * 100) // Convert to paise
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    // Manually add missing fields if required by specific integration types
    (request as any).merchantUserId = userId;
    (request as any).callbackUrl = callbackUrl;

    console.log(`🚀 Initiating Payment for Order: ${orderId}, Amount: ${amount}`);
    // console.log("Request Payload:", JSON.stringify(request, null, 2));

    const response = await client.pay(request);

    console.log("✅ Payment Initiated Successfully. Redirect URL:", response.redirectUrl);

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
export async function checkPaymentStatus(merchantTransactionId: string) {
  try {
    console.log(`🔄 Checking Payment Status for: ${merchantTransactionId}`);

    const response = await client.getTransactionStatus(merchantTransactionId);

    console.log("✅ Payment Status Response:", JSON.stringify(response, null, 2));
    return response;

  } catch (error: any) {
    console.error(`❌ PhonePe Status Check Error for ${merchantTransactionId}:`, error.message);
    return { success: false, error: error.message, state: "FAILED" };
  }
}
