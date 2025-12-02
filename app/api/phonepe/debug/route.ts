import { NextResponse } from "next/server";
import crypto from "crypto";
import { Env } from "pg-sdk-node";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
        return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
    }

    const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
    const CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
    const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
    const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || "1";

    // Robust Environment Check
    const envVar = (process.env.PHONEPE_ENV || "").toLowerCase();
    const isProd = envVar === "prod" || envVar === "production";
    const host = isProd ? "https://api.phonepe.com/apis/hermes" : "https://api-preprod.phonepe.com/apis/pg-sandbox";

    const results = {};

    // Helper to check status
    async function check(idType: string, id: string) {
        if (!id) return { error: "ID not set" };

        try {
            const path = `/pg/v1/status/${id}/${transactionId}`;
            const stringToHash = path + CLIENT_SECRET;
            const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
            const checksum = `${sha256}###${CLIENT_VERSION}`;
            const url = `${host}${path}`;

            console.log(`Checking ${idType} (${id})... URL: ${url}`);

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": checksum,
                    "X-MERCHANT-ID": id,
                },
                cache: "no-store"
            });

            const data = await response.json();
            return {
                status: response.status,
                data: data
            };
        } catch (e: any) {
            return { error: e.message };
        }
    }

    // Check with MERCHANT_ID
    (results as any).merchantIdCheck = await check("MERCHANT_ID", MERCHANT_ID || "");

    // Check with CLIENT_ID
    (results as any).clientIdCheck = await check("CLIENT_ID", CLIENT_ID || "");

    return NextResponse.json({
        env: {
            isProd,
            merchantId: MERCHANT_ID,
            clientId: CLIENT_ID,
            host
        },
        results
    });
}
