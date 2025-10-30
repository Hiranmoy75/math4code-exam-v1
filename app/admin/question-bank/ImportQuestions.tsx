"use client";

import { parseExcelQuestions } from "@/lib/import/excel";
import { parseWordQuestions } from "@/lib/import/word";
import { parseLatexQuestions } from "@/lib/import/latex";
import type { ImportedQuestion } from "@/lib/import/types";
import { createClient } from "@/lib/supabase/client";

export default function ImportQuestions({ adminId }: { adminId: string }) {
  const handleImport = async (file: File) => {
    let parsed: ImportedQuestion[] = [];

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      parsed = await parseExcelQuestions(file);
    } else if (file.name.endsWith(".docx")) {
      parsed = await parseWordQuestions(file);
    } else if (file.name.endsWith(".tex")) {
      parsed = await parseLatexQuestions(file);
    } else {
      alert("Unsupported file format");
      return;
    }

    console.log("parsed",parsed)

    const supabase = createClient();

    for (const q of parsed) {
      const { data: qb, error } = await supabase
        .from("question_bank")
        .insert({
          admin_id: adminId,
          title: q.title,
          question_text: q.question_text,
          question_type: q.question_type,
          marks: q.marks,
          negative_marks: q.negative_marks,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
        })
        .select("id")
        .single();

      if (error) {
        console.log("Error inserting question", error);
        continue;
      }

      if (q.options?.length) {
        const options = q.options.map((opt, i) => ({
          question_id: qb.id,
          option_text: opt.text,
          option_order: i + 1,
          is_correct: opt.is_correct ?? false,
        }));
        await supabase.from("question_bank_options").insert(options);
      }
    }

    alert(`Imported ${parsed.length} questions!`);
  };

  return (
    <div className="p-4 border rounded-lg">
      <p className="mb-2 font-semibold">Import Questions (Excel/Word/LaTeX)</p>
      <input
        type="file"
        accept=".xlsx,.xls,.docx,.tex"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
      />
    </div>
  );
}
