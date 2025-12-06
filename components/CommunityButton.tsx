"use client";

import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useCommunityModal } from "@/context/CommunityModalContext";

export function CommunityButton() {
    const { openCommunity } = useCommunityModal();

    return (
        <Button
            onClick={() => openCommunity()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
            <Users className="h-4 w-4" />
            Go to Community
        </Button>
    );
}
