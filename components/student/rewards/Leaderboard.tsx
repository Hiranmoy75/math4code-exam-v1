import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLeaderboard } from "@/hooks/useRewards";

interface LeaderboardEntry {
    user_id: string;
    total_coins: number;
    weekly_xp: number;
    xp: number;
    level: number;
    profiles: {
        full_name: string;
        avatar_url: string;
    };
}

export default function Leaderboard({
    currentUserId
}: {
    currentUserId: string
}) {
    const [view, setView] = useState<'weekly' | 'all_time'>('weekly');
    const { data, isLoading } = useLeaderboard(view);

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Leaderboard
                    </CardTitle>
                    <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-[160px]">
                        <TabsList className="grid w-full grid-cols-2 h-8">
                            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                            <TabsTrigger value="all_time" className="text-xs">All Time</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data?.map((entry: LeaderboardEntry, index: number) => {
                            const isMe = entry.user_id === currentUserId;
                            const score = view === 'weekly' ? entry.weekly_xp : entry.total_coins;
                            const label = view === 'weekly' ? 'XP' : 'Coins';

                            return (
                                <div
                                    key={entry.user_id}
                                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isMe ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                        }`}
                                >
                                    <div className="w-6 text-center font-bold text-slate-500">
                                        {index === 0 ? <Crown className="w-5 h-5 text-yellow-500 mx-auto" /> :
                                            index === 1 ? <Medal className="w-5 h-5 text-slate-400 mx-auto" /> :
                                                index === 2 ? <Medal className="w-5 h-5 text-amber-600 mx-auto" /> :
                                                    `#${index + 1}`}
                                    </div>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={entry.profiles?.avatar_url} />
                                        <AvatarFallback>{entry.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isMe ? "text-indigo-700 dark:text-indigo-300" : ""}`}>
                                            {entry.profiles?.full_name || "Unknown User"}
                                            {isMe && " (You)"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Level {entry.level || 1}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{score}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
