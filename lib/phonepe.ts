import { StandardCheckoutClient, Env, MetaInfo, StandardCheckoutPayRequest } from 'pg-sdk-node';
import crypto from 'crypto';

// Environment Variables
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || MERCHANT_ID; // Default to Merchant ID if Client ID is not set
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

// Initialize PhonePe Client
const client = StandardCheckoutClient.getInstance(
  CLIENT_ID || "MISSING_CLIENT_ID",
  CLIENT_SECRET || "MISSING_SECRET",
  CLIENT_VERSION,
  PHONEPE_ENV
);

/**
 * Check Payment Status using Manual Fetch (Bypassing SDK for debugging)
 */
export async function checkPaymentStatus(merchantTransactionId: string) {
  try {
    console.log(`🔄 Checking Payment Status (Manual) for: ${merchantTransactionId}`);

    const merchantId = MERCHANT_ID;
    const saltKey = CLIENT_SECRET;
    const saltIndex = CLIENT_VERSION;

    if (!merchantId || !saltKey) {
      throw new Error("Missing Merchant ID or Salt Key");
    }

    // Construct Checksum
    // Pattern: /pg/v1/status/{merchantId}/{merchantTransactionId} + saltKey
    const path = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const stringToHash = path + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = `${sha256}###${saltIndex}`;

    // Determine Host
    const host = PHONEPE_ENV === Env.PRODUCTION
      ? "https://api.phonepe.com/apis/hermes"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    const url = `${host}${path}`;

    console.log("   - URL:", url);
    console.log("   - X-VERIFY:", checksum);
    console.log("   - X-MERCHANT-ID:", merchantId);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
      },
      cache: "no-store"
    });

    const data = await response.json();

    console.log("✅ Payment Status Response (Manual):", JSON.stringify(data, null, 2));
    return data;

  } catch (error: any) {
    console.error(`❌ PhonePe Status Check Error for ${merchantTransactionId}:`, error.message);
    return { success: false, error: error.message, state: "FAILED" };
  }
}
