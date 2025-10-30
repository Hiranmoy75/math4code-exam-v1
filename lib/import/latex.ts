import { ImportedQuestion } from "./types";

export async function parseLatexQuestions(file: File): Promise<ImportedQuestion[]> {
  const text = await file.text();
  const blocks = text.split("\\begin{question}").slice(1);

  return blocks.map((block, idx): ImportedQuestion => {
    const content = block.split("\\end{question}")[0];

    const get = (cmd: string) => {
      const regex = new RegExp(`\\\\${cmd}\\s+([^\\n]+)`, "i");
      return regex.exec(content)?.[1]?.trim() ?? "";
    };

    const options = [...content.matchAll(/\\option\s+(.+)/g)].map((m, i) => {
      const rightAnswer = get("answer").split(",").map((s) => s.trim());
      return { text: m[1], is_correct: rightAnswer.includes(String(i + 1)) };
    });

    return {
      title: `Question ${idx + 1}`,
      question_text: content.split("\\option")[0].trim(),
      subject: get("subject"),
      topic: get("topic"),
      question_type: get("type").toUpperCase() as any,
      options,
      correct_answer: get("answer"),
      explanation: get("explanation"),
      marks: Number(get("marks") || 1),
      negative_marks: Number(get("negativemarks") || 0),
      difficulty: (get("difficulty") || "easy").toLowerCase() as any,
    };
  });
}
