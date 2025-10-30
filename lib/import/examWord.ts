import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/client";

type ExamBlock = {
  title: string;
  description?: string;
  duration_minutes: number;
  total_marks: number;
  negative_marking: number;
  status: "draft" | "published" | "archived";
  start_time?: string;
  end_time?: string;
  sections: SectionBlock[];
};

type SectionBlock = {
  title: string;
  duration_minutes: number;
  total_marks: number;
  section_order: number;
  questions: QuestionBlock[];
};

type QuestionBlock = {
  question_text: string;
  question_type: "MCQ" | "MSQ" | "NAT";
  options: { text: string; is_correct: boolean }[];
  correct_answer?: string;
  explanation?: string;
  marks: number;
  negative_marks: number;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
};

function getField(block: string, label: string): string {
  const regex = new RegExp(`\\{${label}\\}\\s*([^\\n]*)`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : "";
}

// 🔎 Parse the Word .docx into structured Exam
export async function parseExamWord(file: File): Promise<ExamBlock> {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });

  // exam block
  const examBlock = value.split("{EXAM BEGINS}")[1].split("{EXAM ENDS}")[0];

  const exam: ExamBlock = {
    title: getField(examBlock, "EXAM TITLE"),
    description: getField(examBlock, "DESCRIPTION"),
    duration_minutes: Number(getField(examBlock, "DURATION MINUTES") || 0),
    total_marks: Number(getField(examBlock, "TOTAL MARKS") || 0),
    negative_marking: Number(getField(examBlock, "NEGATIVE MARKING") || 0),
    status: (getField(examBlock, "STATUS") || "draft") as any,
    start_time: getField(examBlock, "START TIME") || undefined,
    end_time: getField(examBlock, "END TIME") || undefined,
    sections: [],
  };

  // sections
  const sectionBlocks = examBlock.split("{SECTION BEGINS}").slice(1);
  for (const sb of sectionBlocks) {
    const sectionPart = sb.split("{SECTION ENDS}")[0];
    const section: SectionBlock = {
      title: getField(sectionPart, "SECTION TITLE"),
      duration_minutes: Number(getField(sectionPart, "DURATION MINUTES") || 0),
      total_marks: Number(getField(sectionPart, "TOTAL MARKS") || 0),
      section_order: Number(getField(sectionPart, "SECTION ORDER") || 0),
      questions: [],
    };

    const qBlocks = sectionPart.split("{QUESTION BEGINS}").slice(1);
    for (const qb of qBlocks) {
      const qPart = qb.split("{QUESTION ENDS}")[0];
      const qType = (getField(qPart, "QUESTION TYPE") || "MCQ").toUpperCase();

      const rightAns = getField(qPart, "RIGHT ANSWER");
      const options = Array.from({ length: 10 })
        .map((_, i) => {
          const txt = getField(qPart, `OPTION ${i + 1}`);
          if (!txt) return null;
          const isCorrect =
            rightAns.split(",").map((x) => x.trim()).includes(String(i + 1));
          return { text: txt, is_correct: isCorrect };
        })
        .filter(Boolean) as { text: string; is_correct: boolean }[];

      const question: QuestionBlock = {
        question_text: getField(qPart, "QUESTION TEXT"),
        question_type: qType as any,
        options: qType === "NAT" ? [] : options,
        correct_answer: qType === "NAT" ? rightAns : undefined,
        explanation: getField(qPart, "EXPLANATION"),
        marks: Number(getField(qPart, "CORRECT MARKS") || 1),
        negative_marks: Number(getField(qPart, "NEGATIVE MARKS") || 0),
        difficulty: (getField(qPart, "DIFFICULTY") || "easy") as any,
        topic: getField(qPart, "TOPIC"),
      };

      section.questions.push(question);
    }

    exam.sections.push(section);
  }

  return exam;
}

// 🔎 Insert Exam + Sections + Questions into Supabase
export async function importExamToSupabase(file: File, adminId: string) {
  const exam = await parseExamWord(file);
  const supabase = createClient();

  // insert exam
  const { data: examRow, error: examErr } = await supabase
    .from("exams")
    .insert({
      admin_id: adminId,
      title: exam.title,
      description: exam.description,
      duration_minutes: exam.duration_minutes,
      total_marks: exam.total_marks,
      negative_marking: exam.negative_marking,
      status: exam.status,
      start_time: exam.start_time,
      end_time: exam.end_time,
    })
    .select("id")
    .single();

  if (examErr) throw examErr;

  const examId = examRow.id;

  // insert sections + questions
  for (const sec of exam.sections) {
    const { data: secRow, error: secErr } = await supabase
      .from("sections")
      .insert({
        exam_id: examId,
        title: sec.title,
        duration_minutes: sec.duration_minutes,
        total_marks: sec.total_marks,
        section_order: sec.section_order,
      })
      .select("id")
      .single();
    if (secErr) throw secErr;

    const secId = secRow.id;

    for (const q of sec.questions) {
      // 1️⃣ Insert into question_bank
      const { data: qbRow, error: qbErr } = await supabase
        .from("question_bank")
        .insert({
          admin_id: adminId,
          title: q.question_text.slice(0, 50), // short title
          question_text: q.question_text,
          question_type: q.question_type,
          marks: q.marks,
          negative_marks: q.negative_marks,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          subject: sec.title,
          topic: q.topic,
          difficulty: q.difficulty,
        })
        .select("id")
        .single();
      if (qbErr) throw qbErr;

      const qbId = qbRow.id;

      if (q.options.length) {
        const options = q.options.map((o, i) => ({
          question_id: qbId,
          option_text: o.text,
          option_order: i + 1,
          is_correct: o.is_correct,
        }));
        await supabase.from("question_bank_options").insert(options);
      }

      // 2️⃣ Insert into questions (exam delivery table)
      const { data: qRow, error: qErr } = await supabase
        .from("questions")
        .insert({
          section_id: secId,
          question_text: q.question_text,
          question_type: q.question_type,
          marks: q.marks,
          negative_marks: q.negative_marks,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        })
        .select("id")
        .single();
      if (qErr) throw qErr;

      const questionId = qRow.id;

      if (q.options.length) {
        const opts = q.options.map((o, i) => ({
          question_id: questionId,
          option_text: o.text,
          option_order: i + 1,
          is_correct: o.is_correct,
        }));
        await supabase.from("options").insert(opts);
      }
    }
  }

  return exam;
}
