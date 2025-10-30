import { createClient } from "@/lib/supabase/client";

// —— Helpers ——
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
  section_order: number;
  questions: QuestionBlock[];
};

type QuestionBlock = {
  question_text: string;
  question_type: "MCQ" | "MSQ" | "NAT";
  options: { text: string; is_correct: boolean }[];
  correct_answer?: string | null;
  explanation?: string | null;
  marks: number;
  negative_marks: number;
  difficulty?: "easy" | "medium" | "hard";
  topic?: string;
};

function stripComments(src: string): string {
  // remove LaTeX comments (%) to avoid confusing regex, preserve newlines
  return src.replace(/(^|[\r\n])\s*%.*$/gm, "$1");
}

// Matches: \textbf{Label:} value
function metaLine(text: string, label: string): string | null {
  const re = new RegExp(`\\\\textbf\\{${label}:\\}\\s*([^\\\\\\n]+)`, "i");
  return re.exec(text)?.[1]?.trim() ?? null;
}

// Collect all matches (group 1) for a regex with the global flag
function collect(text: string, re: RegExp): string[] {
  return [...text.matchAll(re)].map((m) => m[1].trim());
}

// —— Parser ——
export async function parseExamLatex(file: File): Promise<ExamBlock> {
  const raw = await file.text();
  const text = stripComments(raw);

  // Exam title from \begin{exam}{Title}
  const title = (text.match(/\\begin{exam}\{([^}]*)\}/)?.[1] || "Untitled Exam").trim();

  const exam: ExamBlock = {
    title,
    description: metaLine(text, "Description") || "",
    duration_minutes: Number((metaLine(text, "Duration") || "0").replace(/minutes?/i, "").trim()),
    total_marks: Number(metaLine(text, "Total Marks") || 0),
    negative_marking: Number(metaLine(text, "Negative Marking") || 0),
    status: (metaLine(text, "Status")?.toLowerCase() || "draft") as "draft" | "published" | "archived",
    start_time: metaLine(text, "Start Time") || undefined,
    end_time: metaLine(text, "End Time") || undefined,
    sections: [],
  };

  // Sections
  const sectionBlocks = text.split("\\begin{examsection}").slice(1);
  for (const sb of sectionBlocks) {
    const headerMatch = sb.match(/\{(\d+)\}\{([^}]*)\}/); // {order}{title}
    const section_order = Number(headerMatch?.[1] ?? 0);
    const section_title = (headerMatch?.[2] ?? "Untitled").trim();

    const sectionBody = sb.split("\\end{examsection}")[0];

    // Find positions of each question start, bound blocks accordingly
    const qStartMatches = [...sectionBody.matchAll(/^\s*\\question\s*(?=\{)/gm)];
    const starts = qStartMatches.map((m) => m.index ?? 0);
    // nothing found → empty section
    if (!starts.length) {
      exam.sections.push({ title: section_title, section_order, questions: [] });
      continue;
    }
    starts.push(sectionBody.length); // sentinel end

    const questions: QuestionBlock[] = [];

    for (let i = 0; i < starts.length - 1; i++) {
      const start = starts[i]!;
      const end = starts[i + 1]!;
      let qblock = sectionBody.slice(start, end);

      // remove the leading \question and spaces
      qblock = qblock.replace(/^\s*\\question\s*/m, "");

      // Header: {TYPE}{TEXT}{MARKS}{NEG}{DIFF}{TOPIC}
      // Allow spaces around braces and multiline TEXT
      const headerRe =
        /^\{\s*([^}]*)\s*\}\s*\{\s*([\s\S]*?)\s*\}\s*\{\s*([^}]*)\s*\}\s*\{\s*([^}]*)\s*\}\s*\{\s*([^}]*)\s*\}\s*\{\s*([^}]*)\s*\}/;
      const meta = qblock.match(headerRe);
      if (!meta) continue; // skip malformed question

      const qType = (meta[1] || "MCQ").toUpperCase() as "MCQ" | "MSQ" | "NAT";
      const qText = (meta[2] || "").trim();
      const marks = Number(meta[3] || 1);
      const neg = Number(meta[4] || 0);
      const diff = (meta[5] || "easy").toLowerCase() as "easy" | "medium" | "hard";
      const topic = ((meta[6] || "").trim()) || undefined;

      const content = qblock.slice(meta[0].length).trim();

      // Options (optional)
      const options: { text: string; is_correct: boolean }[] = [];
      const optionsMatch = content.match(/\\begin{options}([\s\S]*?)\\end{options}/);
      if (optionsMatch) {
        // Each \item can be multiline; capture until next \item or end
        const items: string[] = [];
        const body = optionsMatch[1];
        const itemRe = /\\item\s+([\s\S]*?)(?=\\item\s+|$)/g;
        for (const m of body.matchAll(itemRe)) {
          items.push(m[1].trim());
        }
        items.forEach((t) => options.push({ text: t, is_correct: false }));
      }

      // Answer(s)
      const ansRaw = (content.match(/\\answer\{([^}]*)\}/)?.[1] || "").trim();
      if (ansRaw && (qType === "MCQ" || qType === "MSQ")) {
        ansRaw.split(",").forEach((token) => {
          const a = token.trim();
          let idx = -1;
          if (/^[A-Za-z]$/.test(a)) {
            idx = a.toUpperCase().charCodeAt(0) - 65; // A→0
          } else if (/^\d+$/.test(a)) {
            idx = Number(a) - 1; // 1-based → 0-based
          }
          if (idx >= 0 && options[idx]) options[idx].is_correct = true;
        });
      }

      // Explanation (optional)
      const explanation = (content.match(/\\explanation\{([^}]*)\}/)?.[1] || "").trim() || null;

      // Final push
      questions.push({
        question_text: qText,
        question_type: qType,
        options: qType === "NAT" ? [] : options,
        correct_answer: qType === "NAT" ? (ansRaw || null) : null,
        explanation,
        marks,
        negative_marks: neg,
        difficulty: diff,
        topic,
      });
    }

    exam.sections.push({
      title: section_title,
      section_order,
      questions,
    });
  }

  return exam;
}


// 🔎 Insert Exam + Sections + Questions into Supabase
export async function importExamLatex(file: File, adminId: string) {
  const supabase = createClient();
  const exam = await parseExamLatex(file);

  // Insert exam
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

  // Insert sections + questions
  for (const sec of exam.sections) {
       const sectionTotalMarks = sec.questions.reduce((sum, q) => {
      const m = Number.isFinite(q.marks) ? Number(q.marks) : 0;
      return sum + m;
    }, 0);
    const { data: secRow, error: secErr } = await supabase
      .from("sections")
      .insert({
        exam_id: examId,
        title: sec.title,
        duration_minutes: 0, // optional to extend
        total_marks: sectionTotalMarks,
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
          title: q.question_text.slice(0, 50),
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
        await supabase.from("question_bank_options").insert(
          q.options.map((o, i) => ({
            question_id: qbId,
            option_text: o.text,
            option_order: i + 1,
            is_correct: o.is_correct,
          }))
        );
      }

      // 2️⃣ Insert into questions
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

      const qId = qRow.id;

      if (q.options.length) {
        await supabase.from("options").insert(
          q.options.map((o, i) => ({
            question_id: qId,
            option_text: o.text,
            option_order: i + 1,
            is_correct: o.is_correct,
          }))
        );
      }
    }
  }

  return exam;
}
