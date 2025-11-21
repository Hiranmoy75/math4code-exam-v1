// lib/parsePdf.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Type definitions
 */
export type ParsedOption = {
  label?: string;
  text: string;
  is_correct?: boolean;
};

export type ParsedQuestion = {
  number?: number;
  question_text: string;
  question_type?: "MCQ" | "MSQ" | "NAT";
  marks?: number;
  options?: ParsedOption[];
  correct_answer?: string | null;
  explanation?: string | null;
};

/**
 * Extract text from PDF using Gemini Vision (handles text + images)
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("🧠 Gemini: extracting text from PDF...");
    const fileBase64 = buffer.toString("base64");

    const prompt = `
      You are a text extraction engine.
      Read the provided PDF and return its raw textual content.
      Do not summarize or format—just return the plain text.
    `;

    const result = await model.generateContent([
      { inlineData: { mimeType: "application/pdf", data: fileBase64 } },
      { text: prompt },
    ]);

    const text = result.response.text().trim();
    console.log("✅ Gemini extracted text length:", text.length);
    return text;
  } catch (err: any) {
    console.error("❌ Gemini text extraction failed:", err.message);
    return "";
  }
}

/**
 * Parse questions using Gemini directly from extracted text.
 * Produces structured JSON ready for Supabase insertion.
 */
export async function parseQuestionsWithGemini(text: string): Promise<ParsedQuestion[]> {
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an expert in parsing question papers.
Extract all MCQs from the following text.
Each question block usually looks like:

1. Question text
(a) Option 1
(b) Option 2
(c) Option 3
(d) Option 4
Answer: b

Return a valid JSON array only, like:
[
  {
    "number": 1,
    "question_text": "What is 2 + 2?",
    "question_type": "MCQ",
    "marks": 1,
    "options": [
      {"label": "a", "text": "3", "is_correct": false},
      {"label": "b", "text": "4", "is_correct": true},
      {"label": "c", "text": "5", "is_correct": false},
      {"label": "d", "text": "6", "is_correct": false}
    ],
    "correct_answer": "b"
  }
]

The JSON must be strictly valid. Do not add explanations outside the array.
Here is the text to parse:
${text.slice(0, 12000)}
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let questions: ParsedQuestion[] = [];
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch (e) {
      console.warn("⚠️ Gemini returned non-JSON text, retrying regex fallback");
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) questions = JSON.parse(match[0]);
    }

    console.log(`✅ Gemini parsed ${questions.length} questions`);
    return questions;
  } catch (err: any) {
    console.error("❌ Gemini parseQuestionsWithGemini failed:", err.message);
    return [];
  }
}
