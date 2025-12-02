import { StandardCheckoutClient, Env, MetaInfo, StandardCheckoutPayRequest } from 'pg-sdk-node';
import crypto from 'crypto';

// Environment Variables
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || MERCHANT_ID;
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const CLIENT_VERSION = parseInt(process.env.PHONEPE_CLIENT_VERSION || "1");
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";

// Robust Environment Check
const envVar = (process.env.PHONEPE_ENV || "").toLowerCase();
const isProd = envVar === "prod" || envVar === "production";
const PHONEPE_ENV = isProd ? Env.PRODUCTION : Env.SANDBOX;

// Validation
if (!MERCHANT_ID || !CLIENT_SECRET) {
  console.error("❌ PhonePe Error: Missing Required Environment Variables (MERCHANT_ID or CLIENT_SECRET)");
}

console.log("💳 Initializing PhonePe Client...");
console.log("   - Env Var:", process.env.PHONEPE_ENV);
console.log("   - Resolved Env:", isProd ? "PRODUCTION" : "SANDBOX");
console.log("   - Merchant ID:", MERCHANT_ID);
console.log("   - Client ID:", CLIENT_ID);
console.log("   - Domain:", DOMAIN);

// Initialize PhonePe SDK Client
const client = StandardCheckoutClient.getInstance(
  CLIENT_ID || "MISSING_CLIENT_ID",
  CLIENT_SECRET || "MISSING_SECRET",
  CLIENT_VERSION,
  PHONEPE_ENV
);

/**
 * Initiate Payment using SDK (Standard Checkout v2)
 */
export async function createPayment(merchantTransactionId: string, amount: number, userId: string) {
  try {
    const redirectUrl = `${DOMAIN}/api/phonepe/redirect?transactionId=${merchantTransactionId}`;
    const callbackUrl = `${DOMAIN}/api/phonepe/callback`;

    // Create MetaInfo
    const metaInfo = MetaInfo.builder()
      .udf1("course_purchase")
      .udf2(userId)
      .build();

    // Build Request
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(amount * 100) // Convert to paise
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    // Manually add fields
    (request as any).merchantUserId = userId;
    (request as any).merchantTransactionId = merchantTransactionId;
    (request as any).callbackUrl = callbackUrl;

    console.log(`🚀 Initiating Payment (SDK) for Order: ${merchantTransactionId}, Amount: ${amount}`);

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
 * Check Payment Status with Fallback Logic
 * 1. Try SDK (uses CLIENT_ID)
 * 2. If failed, try Manual with MERCHANT_ID
 * 3. If failed, try Manual with CLIENT_ID
 */
export async function checkPaymentStatus(merchantTransactionId: string) {
  console.log(`🔄 Checking Payment Status for: ${merchantTransactionId}`);

  // 1. Try SDK first
  try {
    console.log("   - Attempt 1: SDK (Client ID)");
    const response = await client.getTransactionStatus(merchantTransactionId);
    console.log("   ✅ SDK Success:", JSON.stringify(response, null, 2));
    return response;
  } catch (error: any) {
    console.warn("   ⚠️ SDK Check Failed:", error.message);
  }

  // 2. Try Manual with MERCHANT_ID
  try {
    console.log("   - Attempt 2: Manual (Merchant ID)");
    const response = await manualCheck(MERCHANT_ID!, merchantTransactionId);
    if (response.success || response.code === "PAYMENT_SUCCESS" || response.code === "COMPLETED") {
      console.log("   ✅ Manual (Merchant ID) Success:", JSON.stringify(response, null, 2));
      return response;
    }
    console.warn("   ⚠️ Manual (Merchant ID) Failed/Pending:", response);
  } catch (error: any) {
    console.warn("   ⚠️ Manual (Merchant ID) Error:", error.message);
  }

  // 3. Try Manual with CLIENT_ID (if different)
  if (CLIENT_ID && CLIENT_ID !== MERCHANT_ID) {
    try {
      console.log("   - Attempt 3: Manual (Client ID)");
      const response = await manualCheck(CLIENT_ID, merchantTransactionId);
      console.log("   ✅ Manual (Client ID) Response:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("   ❌ Manual (Client ID) Error:", error.message);
    }
  }

  return { success: false, code: "FAILED", message: "Transaction not found in all attempts" };
}

async function manualCheck(merchantId: string, transactionId: string) {
  const saltKey = CLIENT_SECRET;
  const saltIndex = CLIENT_VERSION;

  const path = `/pg/v1/status/${merchantId}/${transactionId}`;
  const stringToHash = path + saltKey;
  const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
  const checksum = `${sha256}###${saltIndex}`;

  const host = PHONEPE_ENV === Env.PRODUCTION
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

  const url = `${host}${path}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": merchantId,
    },
    cache: "no-store"
  });

  return await response.json();
}
