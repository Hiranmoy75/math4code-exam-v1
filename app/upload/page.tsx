// app/upload/page.tsx
"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return toast.error("Please choose a PDF file");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setExamId(data.exam_id);
        toast.success("Exam created!");
      } else {
        toast.error(data.message || "Upload failed");
      }
    } catch (e:any) {
      toast.error(e.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Upload PDF (Admin / Student)</h1>
      <p className="text-sm text-slate-600">Upload a question PDF. We'll convert it to a practice exam.</p>

      <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className="flex gap-2">
        <Button onClick={handleUpload} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Processing..." : "Upload & Generate"}
        </Button>
      </div>

      {examId && (
        <div className="p-3 bg-emerald-50 border rounded">
          ✅ Exam created — <a className="text-indigo-600 underline" href={`/student/practice-set/${examId}/start`}>Start Practice</a>
        </div>
      )}
    </div>
  );
}
