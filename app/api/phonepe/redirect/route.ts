// app/api/payment/status/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { merchantTransactionId } = await req.json();

    const merchantId = process.env.PHONEPE_MERCHANT_ID!;
    const saltKey = process.env.PHONEPE_SALT_KEY!;
    const saltIndex = process.env.PHONEPE_SALT_INDEX!;
    const baseUrl = process.env.PHONEPE_BASE_URL!;

    const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
    const stringToSign = endpoint + saltKey;
    const sha256Hash = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const xVerify = `${sha256Hash}###${saltIndex}`;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-MERCHANT-ID": merchantId,
        "X-VERIFY": xVerify,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
