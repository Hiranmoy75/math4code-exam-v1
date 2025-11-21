// app/api/payment/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { amount, name, merchantTransactionId } = await req.json();

    // Environment variables
    const merchantId = process.env.PHONEPE_MERCHANT_ID!;
    const saltKey = process.env.PHONEPE_SALT_KEY!;
    const saltIndex = process.env.PHONEPE_SALT_INDEX!;
    const baseUrl = process.env.PHONEPE_BASE_URL!;
    const redirectUrl = process.env.NEXT_PUBLIC_REDIRECT_URL!;

    // Construct payload
    const payload = {
      merchantId,
      merchantTransactionId,
      amount: amount * 100, // in paise
      merchantUserId: "MUID123",
      redirectUrl,
      redirectMode: "GET",
      callbackUrl: `${redirectUrl}?txnId=${merchantTransactionId}`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Step 1: Base64 encode payload
    const payloadStr = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadStr).toString("base64");

    // Step 2: Create X-VERIFY header
    const endpoint = "/pg/v1/pay";
    const stringToSign = base64Payload + endpoint + saltKey;
    const sha256Hash = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const xVerify = `${sha256Hash}###${saltIndex}`;

    // Step 3: Send request to PhonePe
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await response.json();

    

    // Step 4: Redirect user to PhonePe payment page
    if (data.success && data.data.instrumentResponse.redirectInfo.url) {
      return NextResponse.json({ url: data.data.instrumentResponse.redirectInfo.url });
    } else {
      return NextResponse.json({ error: data.message || "Payment initiation failed" }, { status: 400 });
    }
  } catch (err) {
    console.error("Payment initiation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
