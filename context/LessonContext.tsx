"use client";

import { createContext, useContext } from "react";

interface LessonContextType {
    markComplete: () => void;
    isCompleted: boolean;
}

const LessonContext = createContext<LessonContextType | undefined>(undefined);

export function useLessonContext() {
    const context = useContext(LessonContext);
    if (!context) {
        throw new Error("useLessonContext must be used within a LessonTracker (Provider)");
    }
    return context;
}

export default LessonContext;
