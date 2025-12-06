"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EnrollButtonProps {
    courseId: string;
    price: number;
    isEnrolled: boolean;
    isLoggedIn: boolean;
}

export default function EnrollButton({
    courseId,
    price,
    isEnrolled,
    isLoggedIn,
}: EnrollButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleEnroll = async () => {
        if (!isLoggedIn) {
            router.push("/auth/login?next=/courses/" + courseId);
            return;
        }

        if (isEnrolled) {
            router.push(`/learn/${courseId}`);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("/api/courses/buy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ courseId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to initiate payment");
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                // Free course or direct enrollment success
                toast.success("Enrolled successfully!");
                router.refresh();
                router.push(`/learn/${courseId}`);
            }
        } catch (error: any) {
            console.error("Enrollment error:", error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isEnrolled) {
        return (
            <Button size="lg" className="w-full md:w-auto" onClick={handleEnroll}>
                Continue Learning
            </Button>
        );
    }

    return (
        <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={handleEnroll}
            disabled={isLoading}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {price > 0 ? `Enroll Now - ₹ ${price}` : "Enroll for Free"}
        </Button>
    );
}
