"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Props { userId: string }

export default function RecentAttemptsCard({ userId }: Props) {
  const supabase = createClient();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAttempts() {
      setIsLoading(true);
      const { data } = await supabase
        .from("exam_attempts")
        .select("*, exams(title), profiles(full_name, email)")
        .order("started_at", { ascending: false })
        .limit(5);
      setAttempts(data || []);
      setIsLoading(false);
    }

    fetchAttempts();
  }, [userId, supabase]);

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "default"; // or "success" if you have it
      case "submitted": return "default";
      case "in_progress": return "secondary";
      case "pending": return "destructive";
      default: return "outline";
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return "U";
  };

  return (
    <Card className="col-span-1 lg:col-span-2 border-none shadow-lg bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Recent Student Attempts</CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">Latest exam submissions from your students</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No attempts recorded yet.
          </div>
        ) : (
          <div className="space-y-6">
            {attempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={a.profiles?.avatar_url} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                      {getInitials(a.profiles?.full_name, a.profiles?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {a.profiles?.full_name || a.profiles?.email}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {a.exams?.title} • <span className="text-xs">{a.started_at ? formatDistanceToNow(new Date(a.started_at), { addSuffix: true }) : ''}</span>
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(a.status)} className="capitalize">
                  {a.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
