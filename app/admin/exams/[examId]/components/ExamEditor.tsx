"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ExamEditor({ exam, onSave }: any) {
  const [form, setForm] = useState({
    title: exam.title || "",
    description: exam.description || "",
    duration_minutes: exam.duration_minutes || 60,
    total_marks: exam.total_marks || 100,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ examId: exam.id, payload: form });
      toast.success("Exam updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="grid gap-4 p-4 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Exam Title
          </label>
          <Input
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Duration (minutes)
          </label>
          <Input
            type="number"
            value={form.duration_minutes}
            onChange={(e) =>
              setForm((s) => ({ ...s, duration_minutes: Number(e.target.value) }))
            }
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Total Marks
          </label>
          <Input
            type="number"
            value={form.total_marks}
            onChange={(e) =>
              setForm((s) => ({ ...s, total_marks: Number(e.target.value) }))
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Description
          </label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </motion.div>
  );
}
