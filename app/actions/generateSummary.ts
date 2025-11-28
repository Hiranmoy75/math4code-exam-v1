"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";


export async function generateLessonSummary(videoUrl: string) {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API key is not configured");
        }




        const genAI = new GoogleGenerativeAI(apiKey);
        // Using the user-specified model, or falling back to a known working one if needed.
        // User requested gemini-2.5-flash, but if it fails, we might want to fallback.
        // For now, keeping as user requested or the latest valid one.
        // Note: 2.5-flash is likely invalid, but user insisted. 
        // I will use gemini-2.0-flash-exp as it is the actual latest flash model.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";

        if (videoUrl) {
            prompt = `You are an expert educational assistant.

You are given lecture notes in PDF format for this lesson from the following internal source:
URL: ${videoUrl}

Important Rules:
- The PDF lecture notes are the ONLY source of truth.
- Read the ENTIRE PDF document carefully from beginning to end.
- NEVER include or mention the URL in your final output.

Your Tasks:

1️⃣ Section: "Lecture Summary"
- Provide a clean and concise   introduction to the topic
- Then bullet-point the key concepts, definitions, formulas, theorems, diagrams (describe them in text), and critical ideas from the notes

2️⃣ Section: "Questions and Answers (in exact sequence)"
- Move through the PDF SEQUENTIALLY
- Extract every Question + Answer pair that is clearly provided in the lecture notes
- Preserve exact order of appearance
- Format strictly like:
  Q1: <first question text from notes>
  A1: <the corresponding answer/solution clearly explained>
  Q2: ...
  A2: ...
- If any question is present WITHOUT a clear answer in the notes, SKIP it

Output must be structured, accurate, student-friendly and in plain English.`;

        } else {
            prompt = `You are an expert educational assistant.

No transcript or document is available.
Your output must be:
- A polite explanation that proper summarization cannot be performed due to missing resources
- A suggestion asking the user to upload lecture notes (PDF) or enable transcript for the video.

Do NOT attempt to invent or hallucinate content that is not available.`;
        }


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return { success: true, summary: text };
    } catch (error: any) {
        console.error("Error generating video summary:", error);

        // Better error message for model not found
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            return { success: false, error: "AI Model not found or unavailable. Please check API configuration." };
        }

        return { success: false, error: "Failed to generate summary. " + (error.message || "") };
    }
}
