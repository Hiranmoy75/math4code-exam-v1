import { Env } from 'pg-sdk-node';
import crypto from 'crypto';

// Environment Variables
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
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

console.log("💳 Initializing PhonePe Client (Manual Implementation)...");
console.log("   - Env Var:", process.env.PHONEPE_ENV);
console.log("   - Resolved Env:", isProd ? "PRODUCTION" : "SANDBOX");
console.log("   - Merchant ID:", MERCHANT_ID);
console.log("   - Domain:", DOMAIN);

/**
 * Initiate Payment using Manual Fetch - ensures MERCHANT_ID is used consistently
 */
export async function createPayment(merchantTransactionId: string, amount: number, userId: string) {
  try {
    const merchantId = MERCHANT_ID;
    const saltKey = CLIENT_SECRET;
    const saltIndex = CLIENT_VERSION;

    if (!merchantId || !saltKey) {
      throw new Error("Missing Merchant ID or Client Secret");
    }

    const redirectUrl = `${DOMAIN}/api/phonepe/redirect?transactionId=${merchantTransactionId}`;
    const callbackUrl = `${DOMAIN}/api/phonepe/callback`;

    // Construct Payload for Standard Checkout
    const payload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // in paise
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: callbackUrl,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

    // Construct Checksum
    // Pattern: base64Body + /pg/v1/pay + saltKey
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = `${sha256}###${saltIndex}`;

    // Determine Host
    const host = PHONEPE_ENV === Env.PRODUCTION
      ? "https://api.phonepe.com/apis/hermes"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    const url = `${host}/pg/v1/pay`;

    console.log(`🚀 Initiating Payment (Manual) for Order: ${merchantTransactionId}, Amount: ${amount}`);
    console.log("   - URL:", url);
    console.log("   - Merchant ID:", merchantId);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
      cache: "no-store"
    });

    const data = await response.json();

    console.log("✅ Payment Initiation Response (Manual):", JSON.stringify(data, null, 2));

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return {
        success: true,
        data: {
          redirectUrl: data.data.instrumentResponse.redirectInfo.url
        }
      };
    } else {
      return {
        success: false,
        error: data.message || "Payment initiation failed",
        details: data
      };
    }

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
 * Check Payment Status using Manual Fetch - ensures MERCHANT_ID is used consistently
 */
export async function checkPaymentStatus(merchantTransactionId: string) {
  try {
    console.log(`🔄 Checking Payment Status (Manual) for: ${merchantTransactionId}`);

    const merchantId = MERCHANT_ID;
    const saltKey = CLIENT_SECRET;
    const saltIndex = CLIENT_VERSION;

    if (!merchantId || !saltKey) {
      throw new Error("Missing Merchant ID or Client Secret");
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
