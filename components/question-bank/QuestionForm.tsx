"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // ✅ if you use sonner or your toast lib

type OptionRow = {
  id?: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
};

type Props = {
  questionId?: string;
  onSuccess?: () => void;
};

export default forwardRef(function QuestionForm({ questionId, onSuccess }: Props, ref) {
  const supabase = createClient();
  const qc = useQueryClient(); // ✅ React Query client
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<OptionRow[]>([
    { option_text: "", is_correct: false, option_order: 1 },
    { option_text: "", is_correct: false, option_order: 2 },
  ]);
  const [form, setForm] = useState({
    title: "",
    question_text: "",
    question_type: "MCQ" as "MCQ" | "MSQ" | "NAT",
    marks: 1,
    negative_marks: 0,
    correct_answer: "",
    explanation: "",
    subject: "math",
    topic: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
  });

  useImperativeHandle(ref, () => ({
    submit: async () => handleSubmit(),
  }));

  // ✅ Load existing question when editing
  useEffect(() => {
    if (!questionId) return;
    (async () => {
      const { data, error } = await supabase
        .from("question_bank")
        .select("*")
        .eq("id", questionId)
        .single();

      if (!error && data) {
        setForm({
          title: data.title,
          question_text: data.question_text,
          question_type: data.question_type,
          marks: data.marks,
          negative_marks: data.negative_marks ?? 0,
          correct_answer: data.correct_answer ?? "",
          explanation: data.explanation ?? "",
          subject: data.subject ?? "math",
          topic: data.topic ?? "",
          difficulty: data.difficulty ?? "easy",
        });

        const { data: opt } = await supabase
          .from("question_bank_options")
          .select("*")
          .eq("question_id", questionId)
          .order("option_order", { ascending: true });

        setOptions(
          (opt ?? []).map((o: any) => ({
            id: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
            option_order: o.option_order,
          }))
        );
      }
    })();
  }, [questionId, supabase]);

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { option_text: "", is_correct: false, option_order: prev.length + 1 },
    ]);
  }

  function removeOption(idx: number) {
    setOptions((prev) =>
      prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, option_order: i + 1 }))
    );
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const admin_id = userData?.user?.id;
      if (!admin_id) throw new Error("Not authenticated");

      if (questionId) {
        // ✅ Update existing question
        const { error: qErr } = await supabase
          .from("question_bank")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", questionId);
        if (qErr) throw qErr;

        if (form.question_type !== "NAT") {
          // Delete all old options and insert new
          await supabase.from("question_bank_options").delete().eq("question_id", questionId);
          await supabase.from("question_bank_options").insert(
            options.map((o) => ({
              question_id: questionId,
              option_text: o.option_text,
              option_order: o.option_order,
              is_correct: o.is_correct,
            }))
          );
        } else {
          await supabase.from("question_bank_options").delete().eq("question_id", questionId);
        }

        toast.success("Question updated successfully!");
      } else {
        // ✅ Create new question
        const { data: newQ, error: cErr } = await supabase
          .from("question_bank")
          .insert([{ ...form, admin_id }])
          .select("id")
          .single();
        if (cErr) throw cErr;

        if (form.question_type !== "NAT") {
          const payload = options.map((o) => ({
            question_id: newQ.id,
            option_text: o.option_text,
            option_order: o.option_order,
            is_correct: o.is_correct,
          }));
          if (payload.length) await supabase.from("question_bank_options").insert(payload);
        }

        toast.success("Question created successfully!");
      }

      // ✅ Refresh React Query cache instantly
      qc.invalidateQueries({ queryKey: ["questions"] });

      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const isChoice = form.question_type === "MCQ" || form.question_type === "MSQ";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="rounded-2xl">
        <CardContent className="grid gap-4 p-4">
          {/* Title + Subject */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((s) => ({ ...s, subject: e.target.value }))}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Question</label>
            <Textarea
              value={form.question_text}
              onChange={(e) => setForm((s) => ({ ...s, question_text: e.target.value }))}
              placeholder="Enter question text"
            />
          </div>

          {/* Type, Difficulty, Marks */}
          <div className="grid md:grid-cols-4 gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={form.question_type}
                onValueChange={(v: any) => setForm((s) => ({ ...s, question_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">MCQ</SelectItem>
                  <SelectItem value="MSQ">MSQ</SelectItem>
                  <SelectItem value="NAT">NAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={form.difficulty}
                onValueChange={(v: any) => setForm((s) => ({ ...s, difficulty: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Marks</label>
              <Input
                type="number"
                value={form.marks}
                onChange={(e) =>
                  setForm((s) => ({ ...s, marks: Number(e.target.value || 0) }))
                }
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Negative Marks</label>
              <Input
                type="number"
                step="0.25"
                value={form.negative_marks}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    negative_marks: Number(e.target.value || 0),
                  }))
                }
              />
            </div>
          </div>

          {/* Options for MCQ/MSQ */}
          {isChoice ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Options ({form.question_type === "MCQ" ? "single correct" : "multiple correct"})
              </label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={opt.option_text}
                      onChange={(e) => {
                        const v = e.target.value;
                        setOptions((prev) =>
                          prev.map((o, i) => (i === idx ? { ...o, option_text: v } : o))
                        );
                      }}
                      placeholder={`Option ${idx + 1}`}
                    />
                    <label className="text-sm flex items-center gap-1 px-2">
                      <input
                        type={form.question_type === "MCQ" ? "radio" : "checkbox"}
                        name="correct"
                        checked={opt.is_correct}
                        onChange={(e) => {
                          setOptions((prev) =>
                            prev.map((o, i) =>
                              i === idx
                                ? { ...o, is_correct: e.target.checked }
                                : form.question_type === "MCQ"
                                ? { ...o, is_correct: false }
                                : o
                            )
                          );
                        }}
                      />
                      Correct
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeOption(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" /> Add option
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Correct Answer (NAT)</label>
              <Input
                value={form.correct_answer}
                onChange={(e) =>
                  setForm((s) => ({ ...s, correct_answer: e.target.value }))
                }
              />
            </div>
          )}

          {/* Explanation */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Explanation</label>
            <Textarea
              value={form.explanation}
              onChange={(e) =>
                setForm((s) => ({ ...s, explanation: e.target.value }))
              }
              placeholder="Explain the solution / reasoning"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? "Saving…" : questionId ? "Update" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
