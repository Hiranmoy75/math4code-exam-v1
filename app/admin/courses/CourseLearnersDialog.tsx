"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Users, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CourseLearnersDialogProps {
    courseId: string
    courseTitle: string
}

interface Learner {
    id: string
    user_id: string
    enrolled_at: string
    progress_percentage: number
    profiles: {
        full_name: string | null
        email: string
        avatar_url: string | null
    }
}

export function CourseLearnersDialog({ courseId, courseTitle }: CourseLearnersDialogProps) {
    const [open, setOpen] = useState(false)
    const [learners, setLearners] = useState<Learner[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            fetchLearners()
        }
    }, [open])

    const fetchLearners = async () => {
        setLoading(true)
        const supabase = createClient()

        // Fetch learners using the secure RPC function
        const { data, error } = await supabase
            .rpc('get_course_learners', {
                p_course_id: courseId
            });

        if (error) {
            console.error("Error fetching learners:", JSON.stringify(error, null, 2))
            // Fallback to empty list but show toast
            setLearners([])
        } else {
            // Map the RPC result to the expected format
            const mappedData = (data as any[]).map(item => ({
                id: item.student_id, // Use student_id as the unique key
                user_id: item.student_id,
                enrolled_at: item.enrolled_at,
                progress_percentage: item.progress_percentage,
                profiles: {
                    full_name: item.full_name,
                    email: item.email,
                    avatar_url: item.avatar_url
                }
            }));
            setLearners(mappedData);
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Learners">
                    <Users className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Learners - {courseTitle}</DialogTitle>
                    <DialogDescription>
                        List of all students enrolled in this course.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto mt-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : learners.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No learners enrolled in this course yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Enrolled Date</TableHead>
                                    <TableHead className="text-right">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {learners.map((learner) => (
                                    <TableRow key={learner.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={learner.profiles.avatar_url || ""} />
                                                    <AvatarFallback>
                                                        {learner.profiles.full_name?.charAt(0) || learner.profiles.email?.charAt(0) || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">
                                                        {learner.profiles.full_name || "Unknown User"}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {learner.profiles.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {format(new Date(learner.enrolled_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-sm font-medium">
                                                    {learner.progress_percentage || 0}%
                                                </span>
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${learner.progress_percentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
