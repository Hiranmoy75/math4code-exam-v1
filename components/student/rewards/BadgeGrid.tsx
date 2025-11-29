"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}

const ALL_BADGES: Badge[] = [
    { id: 'streak_7', name: 'Week Warrior', description: 'Maintained a 7-day streak', icon: '🔥' },
    { id: 'streak_30', name: 'Monthly Master', description: 'Maintained a 30-day streak', icon: '👑' },
    { id: 'night_owl', name: 'Night Owl', description: 'Completed a lesson after 10 PM', icon: '🦉' },
    { id: 'social_butterfly', name: 'Ambassador', description: 'Referred a friend who started learning', icon: '🦋' },
    { id: 'quiz_master', name: 'Quiz Whiz', description: 'Scored 100% on 5 quizzes', icon: '🧠' },
];

export default function BadgeGrid({ earnedBadgeIds }: { earnedBadgeIds: string[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-amber-500" />
                    Badges & Achievements
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {ALL_BADGES.map((badge) => {
                        const isUnlocked = earnedBadgeIds.includes(badge.id);
                        return (
                            <TooltipProvider key={badge.id}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isUnlocked
                                            ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                            : "bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 opacity-60 grayscale"
                                            }`}>
                                            <div className={`text-3xl ${isUnlocked ? "animate-bounce-subtle" : ""}`}>
                                                {isUnlocked ? badge.icon : <Lock className="w-8 h-8 p-1 text-slate-400" />}
                                            </div>
                                            <span className="text-xs font-medium text-center truncate w-full">
                                                {badge.name}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-bold">{badge.name}</p>
                                        <p className="text-xs">{badge.description}</p>
                                        {!isUnlocked && <p className="text-xs text-amber-500 mt-1">Locked</p>}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
