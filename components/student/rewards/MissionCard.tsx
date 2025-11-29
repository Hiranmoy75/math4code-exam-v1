"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Zap, Brain, Play, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mission {
    id: string;
    title: string;
    reward: number;
    progress: number;
    goal: number;
    completed: boolean;
    icon: string;
}

const icons: Record<string, any> = {
    Zap, Brain, Play, Star
};

export default function MissionCard({ mission }: { mission: Mission }) {
    const Icon = icons[mission.icon] || Star;
    const progressPercent = (mission.progress / mission.goal) * 100;

    return (
        <Card className={cn("border-l-4 transition-all", mission.completed ? "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-l-indigo-500")}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-2 rounded-full", mission.completed ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600")}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className={cn("font-medium", mission.completed && "text-emerald-700 dark:text-emerald-400")}>{mission.title}</h4>
                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                            +{mission.reward} <span className="text-[10px]">COINS</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Progress value={progressPercent} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{mission.progress}/{mission.goal}</span>
                    </div>
                </div>
                <div>
                    {mission.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                        <Circle className="w-6 h-6 text-slate-300" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
