import axios from "axios";
import crypto from "crypto";

export async function createPayment(orderId: string, amount: number) {
  const url = `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`;

  const payload = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    merchantTransactionId: orderId,
    merchantUserId: "user_123",
    amount: amount * 100, // 💰 Convert to paise
    redirectUrl: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/api/phonepe/redirect`,
    redirectMode: "POST",
    callbackUrl: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/api/phonepe/callback`,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  // Step 1: Base64 encode the payload
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

  // Step 2: Create the checksum signature
  const saltKey = process.env.PHONEPE_SALT_KEY!;
  const saltIndex = process.env.PHONEPE_SALT_INDEX!;
  const stringToHash = payloadBase64 + "/pg/v1/pay" + saltKey;
  const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
  const xVerify = `${sha256}###${saltIndex}`;

  // Step 3: Send request
  // Step 3: Send request
  try {
    const response = await axios.post(
      url,
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID!,
        },
      }
    );

    console.log("📦 PhonePe Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ PhonePe Error:", error.response?.data || error.message);
    console.error("Payload:", JSON.stringify(payload, null, 2));
    return { success: false, error: error.response?.data || error.message };
  }
}
