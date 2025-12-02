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
 * Check Payment Status using Standard Checkout v2 (OAuth Flow)
 * 1. Get O-Bearer Token using Client ID/Secret
 * 2. Call v2 Status API with Token and Merchant ID
 */
export async function checkPaymentStatus(merchantTransactionId: string) {
  console.log(`🔄 Checking Payment Status (v2 OAuth) for: ${merchantTransactionId}`);

  try {
    // 1. Get OAuth Token
    const token = await getOAuthToken();
    if (!token) {
      throw new Error("Failed to generate OAuth token");
    }

    // 2. Call Status API
    const pgHost = isProd
      ? 'https://api.phonepe.com/apis/pg'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

    const url = `${pgHost}/checkout/v2/order/${merchantTransactionId}/status`;

    console.log(`      Status URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${token}`,
        "X-MERCHANT-ID": MERCHANT_ID || ""
      },
      cache: "no-store"
    });

    const data = await response.json();
    console.log("   ✅ Status Response:", JSON.stringify(data, null, 2));

    return data;

  } catch (error: any) {
    console.error("   ❌ Status Check Error:", error.message);
    return { success: false, code: "FAILED", message: error.message };
  }
}

/**
 * Helper to get OAuth Token for Standard Checkout v2
 */
async function getOAuthToken() {
  try {
    const oauthHost = isProd
      ? 'https://api.phonepe.com/apis/identity-manager'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

    const url = `${oauthHost}/v1/oauth/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', CLIENT_ID || "");
    params.append('client_secret', CLIENT_SECRET || "");
    params.append('client_version', (CLIENT_VERSION || 1).toString());

    console.log(`      Getting Token from: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params,
      cache: "no-store"
    });

    const data = await response.json();

    if (data && data.access_token) {
      // console.log("      ✅ Token Generated");
      return data.access_token;
    } else {
      console.error("      ❌ Token Generation Failed:", JSON.stringify(data));
      return null;
    }
  } catch (error: any) {
    console.error("      ❌ Token Error:", error.message);
    return null;
  }
}
