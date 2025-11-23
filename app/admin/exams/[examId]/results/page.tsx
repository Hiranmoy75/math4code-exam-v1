"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Loader2, Search, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams } from "next/navigation";

interface ExamResult {
    attempt_id: string;
    student_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    status: string;
    submitted_at: string | null;
    total_marks: number | null;
    obtained_marks: number | null;
    percentage: number | null;
    rank: number | null;
}

export default function ExamResultsPage() {
    const params = useParams();
    const examId = params.examId as string;
    const [results, setResults] = useState<ExamResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [examTitle, setExamTitle] = useState("");

    useEffect(() => {
        fetchResults();
    }, [examId]);

    const fetchResults = async () => {
        setLoading(true);
        const supabase = createClient();

        // Fetch exam details for title
        const { data: examData } = await supabase
            .from("exams")
            .select("title")
            .eq("id", examId)
            .single();

        if (examData) {
            setExamTitle(examData.title);
        }

        // Fetch results using RPC
        const { data, error } = await supabase.rpc("get_exam_results", {
            p_exam_id: examId,
        });

        if (error) {
            console.error("Error fetching results:", error);
        } else {
            setResults(data as ExamResult[]);
        }
        setLoading(false);
    };

    const filteredResults = results.filter(
        (result) =>
            result.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "graded":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Completed</Badge>;
            case "submitted":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Submitted</Badge>;
            case "in_progress":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">In Progress</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/exams">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Exams
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{examTitle || "Exam Results"}</h1>
                    <p className="text-muted-foreground">
                        View and manage student performance for this exam.
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            <Card className="border-none shadow-md">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Student Results ({results.length})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No results found.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Rank</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead className="text-right">Score</TableHead>
                                        <TableHead className="text-right">Percentage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredResults.map((result, index) => (
                                        <TableRow key={result.attempt_id}>
                                            <TableCell>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-medium text-slate-600">
                                                    {result.rank || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={result.avatar_url || ""} />
                                                        <AvatarFallback>
                                                            {result.full_name?.charAt(0) || result.email?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">
                                                            {result.full_name || "Unknown User"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {result.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(result.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {result.submitted_at
                                                    ? format(new Date(result.submitted_at), "MMM d, yyyy HH:mm")
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {result.obtained_marks !== null ? (
                                                    <span>
                                                        {result.obtained_marks} <span className="text-muted-foreground text-xs">/ {result.total_marks}</span>
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {result.percentage !== null ? (
                                                    <Badge variant={result.percentage >= 70 ? "default" : result.percentage >= 40 ? "secondary" : "destructive"}>
                                                        {result.percentage}%
                                                    </Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
