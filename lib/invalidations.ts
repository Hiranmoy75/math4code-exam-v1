import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

/**
 * Invalidation Helpers
 * Provides consistent query invalidation patterns
 */

export const invalidations = {
    /**
     * After course enrollment
     */
    afterCourseEnrollment: (queryClient: QueryClient, userId: string, courseId: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.user(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrolled(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },

    /**
     * After test series enrollment
     */
    afterTestSeriesEnrollment: (
        queryClient: QueryClient,
        userId: string,
        seriesId: string
    ) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.user(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.testSeries.enrolled(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.testSeries.detail(seriesId) });
    },

    /**
     * After exam submission
     */
    afterExamSubmission: (queryClient: QueryClient, userId: string, attemptId: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.attempts.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.attempts.list(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.attempts.detail(attemptId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.results.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.results.list(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.rewards.user(userId) });
    },

    /**
     * After payment success
     */
    afterPaymentSuccess: (queryClient: QueryClient, userId: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.payments.list(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.user(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrolled(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.testSeries.enrolled(userId) });
    },

    /**
     * After exam creation/update (admin)
     */
    afterExamMutation: (queryClient: QueryClient, examId?: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.exams.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() });
        if (examId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(examId) });
        }
    },

    /**
     * After course creation/update (admin)
     */
    afterCourseMutation: (queryClient: QueryClient, courseId?: string) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
        if (courseId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
        }
    },

    /**
     * After question bank update (admin)
     */
    afterQuestionBankUpdate: (queryClient: QueryClient) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.questionBank() });
    },
};
