export type ImportedQuestion = {
  title?: string;
  question_text: string;
  subject?: string;
  topic?: string;
  question_type: "MCQ" | "MSQ" | "NAT";
  options?: { text: string; is_correct?: boolean }[];
  correct_answer?: string; // for NAT or fill-in
  explanation?: string;
  marks: number;
  negative_marks?: number;
  difficulty?: "easy" | "medium" | "hard";
};
