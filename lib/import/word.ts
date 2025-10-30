import mammoth from "mammoth";
import { ImportedQuestion } from "./types";

export async function parseWordQuestions(file: File): Promise<ImportedQuestion[]> {
  const buffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });

  const blocks = value.split("{QUESTION BEGINS}").slice(1);

  return blocks.map((block, idx): ImportedQuestion => {
    const section = block.split("{QUESTION ENDS}")[0];

    const get = (label: string) => {
      const regex = new RegExp(`\\{${label}\\}\\s*([^\\n]*)`, "i");
      return regex.exec(section)?.[1]?.trim() || "";
    };

    const rightAnswer = get("RIGHT ANSWER");
    const options = Array.from({ length: 10 })
      .map((_, i) => {
        const text = get(`OPTION ${i + 1}`);
        if (!text) return null;
        const isCorrect =
          rightAnswer.split(",").map((s) => s.trim()).includes(String(i + 1));
        return { text, is_correct: isCorrect };
      })
      .filter(Boolean) as { text: string; is_correct?: boolean }[];

    return {
      title: `Question ${idx + 1}`,
      question_text: get("QUESTION TEXT"),
      subject: get("SUBJECT"),
      topic: get("TOPIC"),
      question_type: get("QUESTION TYPE").toUpperCase() as any,
      options,
      correct_answer: rightAnswer,
      explanation: get("EXPLANATION"),
      marks: Number(get("CORRECT MARKS") || 1),
      negative_marks: Number(get("NEGATIVE MARKS") || 0),
      difficulty: (get("DIFFICULTY") || "easy").toLowerCase() as any,
    };
  });
}
