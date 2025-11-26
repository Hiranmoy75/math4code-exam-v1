const axios = require('axios');
const crypto = require('crypto');

// Configuration from .env.local (manually set here for testing)
const MERCHANT_ID = "PGTESTPAYUAT86";
const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076"; // Other Sandbox Salt Key
const SALT_INDEX = 1;
const BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

async function testPayment() {
    const endpoint = "/pg/v1/pay";
    const url = `${BASE_URL}${endpoint}`;

    const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: "TEST_" + Date.now(),
        merchantUserId: "user_123",
        amount: 100, // 1 Rupee
        redirectUrl: "http://localhost:3000/api/phonepe/redirect",
        redirectMode: "POST",
        callbackUrl: "http://localhost:3000/api/phonepe/callback",
        paymentInstrument: {
            type: "PAY_PAGE"
        }
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const stringToHash = payloadBase64 + endpoint + SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const xVerify = `${sha256}###${SALT_INDEX}`;

    console.log("🚀 Testing PhonePe Payment...");
    console.log("URL:", url);
    console.log("Merchant ID:", MERCHANT_ID);
    console.log("X-VERIFY:", xVerify);

    try {
        const response = await axios.post(
            url,
            { request: payloadBase64 },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerify,
                    "X-MERCHANT-ID": MERCHANT_ID,
                },
            }
        );
        console.log("✅ Success!");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testPayment();
