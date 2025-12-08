"use client";

import { useState } from "react";
import { useCoursePayments } from "@/hooks/admin/useCoursePayments";
import { useTestSeriesPayments } from "@/hooks/admin/useTestSeriesPayments";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Copy,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Search,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PaymentHistoryPage() {
    const [activeTab, setActiveTab] = useState("courses");

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
                <p className="text-muted-foreground">
                    View and verify student payments and access grants.
                </p>
            </div>

            <Tabs
                defaultValue="courses"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="courses">Course Enrollments</TabsTrigger>
                    <TabsTrigger value="test-series">Test Series Enrollments</TabsTrigger>
                </TabsList>

                <TabsContent value="courses" className="mt-6">
                    <CoursePaymentsTable />
                </TabsContent>

                <TabsContent value="test-series" className="mt-6">
                    <TestSeriesPaymentsTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CoursePaymentsTable() {
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Simple debounce for search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(e.target.value);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timeoutId);
    };

    const { data, isLoading, isError } = useCoursePayments({
        page,
        pageSize,
        search: debouncedSearch,
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Transaction ID copied to clipboard");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center h-64 text-destructive">
                <AlertCircle className="mr-2 h-5 w-5" />
                Failed to load payment history.
            </div>
        );
    }

    const payments = data?.data || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search Transaction ID..."
                    value={search}
                    onChange={handleSearchChange}
                    className="h-9"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Access Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No payments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => {
                                const hasAccess = payment.enrollments && payment.enrollments.length > 0;
                                const isActive = payment.enrollments?.some(e => e.status === 'active');
                                const isRefunded = payment.status === 'refunded';

                                return (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {payment.profiles?.full_name || payment.profiles?.email || "Unknown"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {payment.profiles?.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {payment.courses?.title || "Unknown Course"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs truncate max-w-[100px]" title={payment.transaction_id}>
                                                    {payment.transaction_id}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => copyToClipboard(payment.transaction_id)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>₹{payment.amount}</TableCell>
                                        <TableCell>
                                            {format(new Date(payment.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    payment.status === "success"
                                                        ? "default"
                                                        : payment.status === "refunded"
                                                            ? "outline"
                                                            : payment.status === "pending"
                                                                ? "outline"
                                                                : "destructive"
                                                }
                                                className={
                                                    payment.status === "success" ? "bg-green-500 hover:bg-green-600" :
                                                        payment.status === "refunded" ? "border-orange-500 text-orange-500" : ""
                                                }
                                            >
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {isRefunded ? (
                                                <Badge variant="outline" className="border-orange-500 text-orange-500 gap-1">
                                                    <XCircle className="h-3 w-3" /> Refunded
                                                </Badge>
                                            ) : hasAccess ? (
                                                isActive ? (
                                                    <Badge variant="outline" className="border-green-500 text-green-500 gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-yellow-500 text-yellow-500 gap-1">
                                                        <AlertCircle className="h-3 w-3" /> Inactive
                                                    </Badge>
                                                )
                                            ) : (
                                                <Badge variant="outline" className="border-red-500 text-red-500 gap-1">
                                                    <XCircle className="h-3 w-3" /> Revoked/Missing
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {(payment.status === "success" || payment.status === "completed") && (
                                                <RefundButton
                                                    transactionId={payment.transaction_id}
                                                    amount={payment.amount}
                                                    userId={payment.user_id}
                                                    paymentId={payment.id}
                                                    type="course"
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                >
                    Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                >
                    Next
                </Button>
            </div>
        </div >
    );
}

function TestSeriesPaymentsTable() {
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(e.target.value);
            setPage(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    };

    const { data, isLoading, isError } = useTestSeriesPayments({
        page,
        pageSize,
        search: debouncedSearch,
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Transaction ID copied to clipboard");
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center h-64 text-destructive">
                <AlertCircle className="mr-2 h-5 w-5" />
                Failed to load payment history.
            </div>
        );
    }

    const payments = data?.data || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search Transaction ID..."
                    value={search}
                    onChange={handleSearchChange}
                    className="h-9"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Test Series</TableHead>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Payment Status</TableHead>
                            <TableHead>Access Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No payments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => {
                                // For test series, we derived 'hasAccess' in the hook
                                const hasAccess = payment.hasAccess;

                                return (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {payment.profiles?.full_name || payment.profiles?.email || "Unknown"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {payment.profiles?.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {payment.test_series?.title || "Unknown Series"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs truncate max-w-[100px]" title={payment.phonepe_transaction_id || ""}>
                                                    {payment.phonepe_transaction_id || "N/A"}
                                                </span>
                                                {payment.phonepe_transaction_id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyToClipboard(payment.phonepe_transaction_id!)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>₹{payment.amount}</TableCell>
                                        <TableCell>
                                            {format(new Date(payment.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    payment.status === "success" || payment.status === "captured" // PhonePe might use captured? or success?
                                                        ? "default"
                                                        : payment.status === "pending"
                                                            ? "outline"
                                                            : "destructive"
                                                }
                                                className={
                                                    (payment.status === "success" || payment.status === "captured") ? "bg-green-500 hover:bg-green-600" : ""
                                                }
                                            >
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {hasAccess ? (
                                                <Badge variant="outline" className="border-green-500 text-green-500 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-red-500 text-red-500 gap-1">
                                                    <XCircle className="h-3 w-3" /> Revoked/Missing
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {(payment.status === "success" || payment.status === "completed" || payment.status === "captured") && (
                                                <RefundButton
                                                    transactionId={payment.phonepe_transaction_id || ""}
                                                    amount={payment.amount}
                                                    userId={payment.user_id}
                                                    paymentId={payment.id}
                                                    type="test-series"
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                >
                    Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

function RefundButton({ transactionId, amount, userId, paymentId, type }: { transactionId: string, amount: number, userId: string, paymentId: string, type: 'course' | 'test-series' }) {
    const [loading, setLoading] = useState(false);

    const handleRefund = async () => {
        if (!confirm(`Are you sure you want to refund ₹${amount} for this transaction? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/admin/payments/refund', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId, amount, userId, paymentId, type })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Refund initiated successfully!');
                // Ideally refresh list here, for now page reload or revalidation
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error(result.error || 'Refund failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleRefund} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refund"}
        </Button>
    );
}
