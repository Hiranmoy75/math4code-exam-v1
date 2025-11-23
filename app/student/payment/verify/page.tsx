"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function PaymentVerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const txnId = searchParams.get("txnId");
    const errorParam = searchParams.get("error");

    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
    const [message, setMessage] = useState("Verifying payment...");

    useEffect(() => {
        if (!txnId) {
            setStatus("failed");
            setMessage("Invalid transaction ID");
            return;
        }

        if (errorParam) {
            setStatus("failed");
            setMessage("Payment failed or was cancelled");
            return;
        }

        const verifyPayment = async () => {
            try {
                const supabase = createClient();

                // Poll for status change (max 5 attempts)
                let attempts = 0;
                const maxAttempts = 5;

                const checkStatus = async () => {
                    // Call our new status check API
                    const response = await fetch("/api/phonepe/check-status", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ transactionId: txnId }),
                    });

                    const data = await response.json();

                    if (data.status === "success") {
                        setStatus("success");
                        setMessage("Payment successful! Redirecting to course...");
                        setTimeout(() => {
                            router.push("/student/dashboard?tab=my-courses");
                        }, 2000);
                        return true;
                    } else if (data.status === "failed") {
                        setStatus("failed");
                        setMessage("Payment failed. Please try again.");
                        return true;
                    }
                    return false;
                };

                const interval = setInterval(async () => {
                    attempts++;
                    const isDone = await checkStatus();
                    if (isDone || attempts >= maxAttempts) {
                        clearInterval(interval);
                        if (!isDone) {
                            setStatus("failed");
                            setMessage("Payment verification timed out. Please check 'My Courses' or contact support.");
                        }
                    }
                }, 2000);

                // Initial check
                await checkStatus();

            } catch (error) {
                console.error("Verification error:", error);
                setStatus("failed");
                setMessage("An error occurred during verification");
            }
        };

        verifyPayment();
    }, [txnId, errorParam, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-blue-500" />}
                        {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
                        {status === "failed" && <XCircle className="h-12 w-12 text-red-500" />}
                    </div>
                    <CardTitle>
                        {status === "loading" && "Processing Payment"}
                        {status === "success" && "Payment Successful"}
                        {status === "failed" && "Payment Failed"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-gray-600">
                    <p>{message}</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    {status !== "loading" && (
                        <Button onClick={() => router.push("/student/dashboard")}>
                            Go to Dashboard
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function PaymentVerifyPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PaymentVerifyContent />
        </Suspense>
    );
}
