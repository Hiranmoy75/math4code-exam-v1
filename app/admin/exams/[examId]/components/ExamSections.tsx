"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function ExamSections({ sections }: any) {
  if (!sections?.length)
    return (
      <p className="text-center text-slate-500 py-6 italic">
        No sections added yet.
      </p>
    );

  return (
    <div className="space-y-6">
      {sections.map((sec: any, i: number) => (
        <motion.div
          key={sec.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {sec.title}{" "}
                  <span className="text-sm text-slate-400">
                    ({sec.total_questions} questions)
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {sec.questions?.length ? (
                  sec.questions.map((q: any, idx: number) => (
                    <li
                      key={q.id}
                      className="rounded-lg bg-slate-50 dark:bg-slate-900/40 p-3 border border-slate-100 dark:border-slate-800 text-sm"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Q{idx + 1}.
                      </span>{" "}
                      {q.question_text}
                      <span className="text-xs text-slate-400 ml-2">
                        ({q.marks} marks)
                      </span>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">No questions</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
