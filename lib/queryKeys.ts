/**
 * Centralized Query Key Factory
 * Provides type-safe, consistent query keys across the application
 */

export const queryKeys = {
    // Auth
    auth: {
        user: () => ["auth", "user"] as const,
        session: () => ["auth", "session"] as const,
    },

    // Courses
    courses: {
        all: () => ["courses"] as const,
        lists: () => ["courses", "list"] as const,
        list: (filters: string) => ["courses", "list", filters] as const,
        details: () => ["courses", "detail"] as const,
        detail: (id: string) => ["courses", "detail", id] as const,
        enrolled: (userId: string) => ["courses", "enrolled", userId] as const,
    },

    // Exams
    exams: {
        all: () => ["exams"] as const,
        lists: () => ["exams", "list"] as const,
        list: (filters?: string) => ["exams", "list", { filters }] as const,
        details: () => ["exams", "detail"] as const,
        detail: (id: string) => ["exams", "detail", id] as const,
        sections: (examId: string) => ["exams", examId, "sections"] as const,
        questions: (sectionId: string) => ["sections", sectionId, "questions"] as const,
    },

    // Attempts
    attempts: {
        all: () => ["attempts"] as const,
        lists: () => ["attempts", "list"] as const,
        list: (userId: string) => ["attempts", "list", userId] as const,
        details: () => ["attempts", "detail"] as const,
        detail: (id: string) => ["attempts", "detail", id] as const,
        active: (userId: string, examId: string) =>
            ["attempts", "active", userId, examId] as const,
    },

    // Results
    results: {
        all: () => ["results"] as const,
        lists: () => ["results", "list"] as const,
        list: (userId: string) => ["results", "list", userId] as const,
        details: () => ["results", "detail"] as const,
        detail: (id: string) => ["results", "detail", id] as const,
        byAttempt: (attemptId: string) => ["results", "attempt", attemptId] as const,
    },

    // Test Series
    testSeries: {
        all: () => ["testSeries"] as const,
        lists: () => ["testSeries", "list"] as const,
        list: (filters?: string) => ["testSeries", "list", { filters }] as const,
        details: () => ["testSeries", "detail"] as const,
        detail: (id: string) => ["testSeries", "detail", id] as const,
        enrolled: (userId: string) => ["testSeries", "enrolled", userId] as const,
        exams: (seriesId: string) => ["testSeries", seriesId, "exams"] as const,
    },

    // Enrollments
    enrollments: {
        all: () => ["enrollments"] as const,
        course: (userId: string, courseId: string) =>
            ["enrollments", "course", userId, courseId] as const,
        testSeries: (userId: string, seriesId: string) =>
            ["enrollments", "testSeries", userId, seriesId] as const,
        user: (userId: string) => ["enrollments", "user", userId] as const,
    },

    // Payments
    payments: {
        all: () => ["payments"] as const,
        lists: () => ["payments", "list"] as const,
        list: (userId?: string) => ["payments", "list", { userId }] as const,
        details: () => ["payments", "detail"] as const,
        detail: (id: string) => ["payments", "detail", id] as const,
        status: (transactionId: string) => ["payments", "status", transactionId] as const,
    },

    // Admin
    admin: {
        students: () => ["admin", "students"] as const,
        analytics: () => ["admin", "analytics"] as const,
        questionBank: (filters?: string) => ["admin", "questionBank", { filters }] as const,
    },

    // Rewards
    rewards: {
        user: (userId: string) => ["rewards", "user", userId] as const,
        leaderboard: () => ["rewards", "leaderboard"] as const,
    },
} as const;

// Type helper to extract query key types
export type QueryKeys = typeof queryKeys;
