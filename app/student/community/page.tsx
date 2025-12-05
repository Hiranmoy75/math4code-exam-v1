"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useEnrolledCourses } from "@/hooks/community/useEnrolledCourses";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseThumbnail } from "@/components/ui/CourseThumbnail";

export default function StudentCommunityPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const { data: courses, isLoading: coursesLoading } = useEnrolledCourses(user?.id);

    if (userLoading || coursesLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!courses || courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center p-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📚</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">No Community Courses</h2>
                <p className="text-muted-foreground max-w-md">
                    You haven't enrolled in any courses with community features yet. Enroll in a course to join the community!
                </p>
                <Button
                    onClick={() => router.push("/student/dashboard?tab=all-courses")}
                    className="mt-6"
                >
                    Browse Courses
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Community</h1>
                <p className="text-muted-foreground">
                    Join discussions, ask questions, and connect with other learners
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="group border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer bg-card"
                        onClick={() => router.push(`/learn/${course.id}/community`)}
                    >
                        <div className="relative aspect-video">
                            <CourseThumbnail
                                src={course.thumbnail_url}
                                title={course.title}
                                variant="card"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                                {course.title}
                            </h3>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{course.channels.length} channels</span>
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
