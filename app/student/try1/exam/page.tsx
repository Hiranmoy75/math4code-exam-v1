'use client'
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Check,
  AlertCircle,
  X,
  Save,
  Play,
  BarChart2,
  Lock,
} from "lucide-react";

/**
 * ExamPanel with Sections + MCQ / MSQ / NAT (responsive, mobile friendly)
 *
 * - Sections (tabs) — each section has its own question list
 * - MCQ: single answer (radio)
 * - MSQ: multiple answers (checkboxes)
 * - NAT: numeric answer input
 * - Palette per section, mobile-friendly
 * - Autosave to localStorage, timer, submit modal, mark/save features
 */

// ---------- sample data (replace with API data) ----------
type Option = { id: string; text: string };
type Q = {
  id: number;
  title: string;
  question: string;
  type: "MCQ" | "MSQ" | "NAT";
  options?: Option[]; // MCQ/MSQ
  marks?: number;
  section?: string;
};

const SECTIONS_DATA: { name: string; questions: Q[] }[] = [
  {
    name: "Section 1",
    questions: [
      {
        id: 101,
        title: "Q1",
        question: "What is 2 + 3 × 4 ?",
        type: "MCQ",
        options: [
          { id: "A", text: "20" },
          { id: "B", text: "14" },
          { id: "C", text: "10" },
          { id: "D", text: "None of the above" },
        ],
        marks: 4,
        section: "Section 1",
      },
      {
        id: 102,
        title: "Q2",
        question: "Select all prime numbers.",
        type: "MSQ",
        options: [
          { id: "A", text: "15" },
          { id: "B", text: "23" },
          { id: "C", text: "29" },
          { id: "D", text: "21" },
        ],
        marks: 4,
        section: "Section 1",
      },
    ],
  },
  {
    name: "Section 2",
    questions: [
      {
        id: 201,
        title: "Q1",
        question: "Which gas is most abundant in Earth's atmosphere?",
        type: "MCQ",
        options: [
          { id: "A", text: "Oxygen" },
          { id: "B", text: "Hydrogen" },
          { id: "C", text: "Nitrogen" },
          { id: "D", text: "Carbon dioxide" },
        ],
        marks: 4,
        section: "Section 2",
      },
      {
        id: 202,
        title: "Q2 (NAT)",
        question: "Enter the square root of 144 (integer).",
        type: "NAT",
        marks: 4,
        section: "Section 2",
      },
    ],
  },
  {
    name: "Section 3",
    questions: [
      {
        id: 301,
        title: "Q1",
        question: "2^5 equals?",
        type: "MCQ",
        options: [
          { id: "A", text: "32" },
          { id: "B", text: "16" },
          { id: "C", text: "64" },
          { id: "D", text: "8" },
        ],
        marks: 4,
        section: "Section 3",
      },
    ],
  },
];

// ---------- storage key ----------
const STORAGE_KEY = "exam_autosave_v1_v2";

// ---------- Component ----------
export default function ExamPanelSections({
  durationMinutes = 60,
  examTitle = "Full Mock - Multi-section",
}: {
  durationMinutes?: number;
  examTitle?: string;
}) {
  // flatten questions with order index (useful for palette global)
  const sections = SECTIONS_DATA;
  const allQuestions = sections.flatMap((s) => s.questions);

  // state
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [currentIdxInSection, setCurrentIdxInSection] = useState(0); // index inside current section
  const [answers, setAnswers] = useState<Record<number, string | string[] | null>>({});
  const [marked, setMarked] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [showSubmit, setShowSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPaletteMobile, setShowPaletteMobile] = useState(false);

  const timerRef = useRef<number | null>(null);

  // derived
  const activeSection = sections[activeSectionIdx];
  const sectionQuestions = activeSection.questions;
  const totalInSection = sectionQuestions.length;
  const currentQuestion = sectionQuestions[currentIdxInSection];

  // load autosave
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.answers) setAnswers(parsed.answers);
        if (parsed?.marked) setMarked(parsed.marked);
        if (parsed?.visited) setVisited(parsed.visited);
        if (parsed?.secondsLeft) setSecondsLeft(parsed.secondsLeft);
      }
    } catch (e) {
      console.warn("failed to load autosave", e);
    }
  }, []);

  // timer
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // autosave (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      setSaving(true);
      const payload = { answers, marked, visited, secondsLeft, savedAt: Date.now() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("save failed", e);
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [answers, marked, visited, secondsLeft]);

  // keyboard shortcuts (MCQ/MSQ numeric shortcuts and NAT numeric input allowed)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;

      if (e.key === "ArrowRight") nextQuestion();
      if (e.key === "ArrowLeft") prevQuestion();
      if (e.key.toLowerCase() === "s") saveAnswer();
      if (e.key.toLowerCase() === "m") toggleMark();

      // numeric shortcuts for MCQ/MSQ: 1..9
      if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        if (currentQuestion.type === "MCQ") {
          const opts = currentQuestion.options ?? [];
          if (opts[idx]) selectMCQ(opts[idx].id);
        } else if (currentQuestion.type === "MSQ") {
          const opts = currentQuestion.options ?? [];
          if (opts[idx]) toggleMSQ(opts[idx].id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentQuestion, currentIdxInSection, activeSectionIdx, answers]);

  // helpers
  const formatTime = (s: number) => {
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // answer handlers
  function selectMCQ(optionId: string) {
    const qid = currentQuestion.id;
    setAnswers((p) => ({ ...p, [qid]: optionId }));
    setVisited((v) => ({ ...v, [qid]: true }));
    setMarked((m) => ({ ...m, [qid]: false }));
  }

  function toggleMSQ(optionId: string) {
    const qid = currentQuestion.id;
    setAnswers((p) => {
      const cur = (p[qid] as string[] | null) ?? [];
      const set = Array.isArray(cur) ? [...cur] : [];
      const has = set.includes(optionId);
      const next = has ? set.filter((x) => x !== optionId) : [...set, optionId];
      return { ...p, [qid]: next };
    });
    setVisited((v) => ({ ...v, [qid]: true }));
  }

  function setNAT(value: string) {
    const qid = currentQuestion.id;
    // optional: validate numeric pattern
    const val = value.replace(/[^\d.-]/g, ""); // allow digits and minus/decimal
    setAnswers((p) => ({ ...p, [qid]: val }));
    setVisited((v) => ({ ...v, [qid]: true }));
  }

  function saveAnswer() {
    setVisited((v) => ({ ...v, [currentQuestion.id]: true }));
  }

  function toggleMark() {
    setMarked((m) => ({ ...m, [currentQuestion.id]: !m[currentQuestion.id] }));
    setVisited((v) => ({ ...v, [currentQuestion.id]: true }));
  }

  // navigation
  function gotoQuestionInSection(index: number) {
    setCurrentIdxInSection(index);
    setVisited((v) => ({ ...v, [sectionQuestions[index].id]: true }));
    setShowPaletteMobile(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevQuestion() {
    if (currentIdxInSection > 0) {
      setCurrentIdxInSection((c) => c - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // optional: if you want wrap or move to previous section
    }
  }

  function nextQuestion() {
    if (currentIdxInSection < totalInSection - 1) {
      setCurrentIdxInSection((c) => c + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // section switching: reset index to 0 of that section
  function switchSection(idx: number) {
    setActiveSectionIdx(idx);
    setCurrentIdxInSection(0);
    setShowPaletteMobile(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // submit
  function submitExam(force = false) {
    if (!force) {
      setShowSubmit(true);
      return;
    }
    // example summary
    const total = allQuestions.length;
    let answered = 0;
    allQuestions.forEach((q) => {
      const a = answers[q.id];
      if (a && (Array.isArray(a) ? a.length > 0 : a !== null && a !== "")) answered++;
    });
    localStorage.removeItem(STORAGE_KEY);
    if (timerRef.current) clearInterval(timerRef.current);
    alert(`Submitted! Answered ${answered}/${total}. (Demo)`);
    setShowSubmit(false);
  }

  // derived counts
  const answeredCount = allQuestions.filter((q) => {
    const a = answers[q.id];
    return a && (Array.isArray(a) ? a.length > 0 : a !== null && a !== "");
  }).length;
  const markedCount = Object.values(marked).filter(Boolean).length;
  const notVisitedCount = allQuestions.filter((q) => !visited[q.id]).length;

  // small helper for pallette status per question id
  function qStatus(q: Q) {
    if (!visited[q.id]) return "notVisited";
    const a = answers[q.id];
    if (Array.isArray(a)) return a.length > 0 ? "answered" : marked[q.id] ? "marked" : "visited";
    return a ? "answered" : marked[q.id] ? "marked" : "visited";
  }

  return (
    <div className="w-full min-h-[72vh] flex flex-col lg:flex-row gap-6">
      {/* LEFT: Question area */}
      <div className="flex-1">
        {/* Top bar: sticky */}
        <div className="sticky top-4 z-20">
          <div className="flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">Test</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">{examTitle}</div>
              <div className="hidden sm:block px-2 text-xs text-slate-500">•</div>
              <div className="hidden sm:block text-xs text-slate-600 dark:text-slate-300">{currentIdxInSection + 1} / {totalInSection} ({activeSection.name})</div>

              {/* Section pills (mobile scrollable) */}
              <div className="ml-0 sm:ml-4 mt-2 sm:mt-0 flex gap-2 overflow-x-auto no-scrollbar">
                {sections.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => switchSection(i)}
                    className={`px-3 py-1 text-xs rounded-md font-medium whitespace-nowrap ${i === activeSectionIdx ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div className="text-sm font-medium text-slate-800 dark:text-white">{formatTime(secondsLeft)}</div>
              </div>
              <button onClick={() => submitExam(false)} className="px-3 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:brightness-95">
                Submit
              </button>
            </div>
          </div>

          {/* mobile quick info row */}
          <div className="flex items-center justify-between mt-3 md:hidden gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-md text-xs">Answered: <strong>{answeredCount}</strong></div>
              <div className="bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-md text-xs">Marked: <strong>{markedCount}</strong></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPaletteMobile((s) => !s)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">Palette</button>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion?.id ?? `q-${activeSectionIdx}-${currentIdxInSection}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="mt-4 rounded-2xl p-5 md:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-700 shadow-lg"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{currentQuestion?.title} • {currentQuestion?.marks ?? 1} marks</div>
              <h3 className="text-base md:text-xl font-semibold text-slate-800 dark:text-white leading-snug">{currentQuestion?.question}</h3>
            </div>
            <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400">Palette on the right</div>
          </div>

          {/* Render by type */}
          <div className="mt-5 grid gap-3">
            {/* MCQ */}
            {currentQuestion?.type === "MCQ" && (currentQuestion.options ?? []).map((opt, i) => {
              const checked = answers[currentQuestion.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => selectMCQ(opt.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors border ${checked ? "bg-indigo-50/90 border-indigo-300 dark:bg-indigo-900/60" : "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-semibold ${checked ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-700"}`}>
                    {opt.id}
                  </div>
                  <div className="text-sm md:text-base font-medium text-slate-800 dark:text-white">{opt.text}</div>
                  <div className="ml-auto text-xs text-slate-400 hidden sm:block">Shortcut: {i + 1}</div>
                </button>
              );
            })}

            {/* MSQ */}
            {currentQuestion?.type === "MSQ" && (currentQuestion.options ?? []).map((opt, i) => {
              const cur = (answers[currentQuestion.id] as string[] | null) ?? [];
              const checked = Array.isArray(cur) && cur.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleMSQ(opt.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors border ${checked ? "bg-yellow-50/90 border-yellow-300 dark:bg-yellow-900/40" : "bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700"}`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-sm text-sm font-semibold ${checked ? "bg-yellow-500 text-white" : "bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-700"}`}>
                    {checked ? "✓" : opt.id}
                  </div>
                  <div className="text-sm md:text-base font-medium text-slate-800 dark:text-white">{opt.text}</div>
                  <div className="ml-auto text-xs text-slate-400 hidden sm:block">Shortcut: {i + 1}</div>
                </button>
              );
            })}

            {/* NAT */}
            {currentQuestion?.type === "NAT" && (
              <div className="flex flex-col gap-3">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={(answers[currentQuestion.id] as string) ?? ""}
                  onChange={(e) => setNAT(e.target.value)}
                  placeholder="Enter numeric answer"
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-white"
                />
                <div className="text-xs text-slate-500 dark:text-slate-400">For NAT: enter integer or decimal as required by question</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={prevQuestion} className="flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm">
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button onClick={nextQuestion} className="flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm">
                Next <ArrowRight className="w-4 h-4" />
              </button>

              <button onClick={saveAnswer} className="flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white">
                <Check className="w-4 h-4" /> Save
              </button>

              <button onClick={toggleMark} className={`flex items-center gap-2 px-3 py-2 rounded-md ${marked[currentQuestion.id] ? "bg-yellow-500 text-white" : "bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"}`}>
                <AlertCircle className="w-4 h-4" /> {marked[currentQuestion.id] ? "Marked" : "Mark for Review"}
              </button>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300">
              Answered: <strong className="text-slate-800 dark:text-white">{answeredCount}</strong> • Marked: <strong>{markedCount}</strong> • Not Visited: <strong>{notVisitedCount}</strong>
            </div>
          </div>
        </motion.div>

        {/* mobile palette (collapsible horizontal) */}
        <AnimatePresence>
          {showPaletteMobile && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden mt-3">
              <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="overflow-x-auto no-scrollbar flex gap-2 py-1">
                  {sectionQuestions.map((q, i) => {
                    const status = qStatus(q);
                    return (
                      <button
                        key={q.id}
                        onClick={() => gotoQuestionInSection(i)}
                        className={`min-w-[44px] px-3 py-2 rounded-md font-medium text-xs flex-shrink-0 transition ${status === "answered" ? "bg-green-500 text-white" : status === "marked" ? "bg-yellow-500 text-white" : status === "visited" ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Desktop Palette & Legend */}
      <div className="w-full lg:w-80 hidden md:block">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-xl p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Question Palette</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-white">Section: {activeSection.name}</div>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{formatTime(secondsLeft)}</div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {sectionQuestions.map((q, i) => {
                const status = qStatus(q);
                return (
                  <button
                    key={q.id}
                    onClick={() => gotoQuestionInSection(i)}
                    className={`text-xs py-2 rounded-md font-medium transition ${status === "answered" ? "bg-green-500 text-white" : status === "marked" ? "bg-yellow-500 text-white" : status === "visited" ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm" /> Answered</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500 rounded-sm" /> Marked</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-100 dark:bg-indigo-800 rounded-sm" /> Visited</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-100 dark:bg-slate-800 rounded-sm" /> Not Visited</div>
            </div>
          </div>

          <div className="rounded-xl p-4 bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">Legend</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Shortcuts</div>
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <div><strong>S</strong> — Save</div>
              <div><strong>M</strong> — Mark for review</div>
              <div><strong>← / →</strong> — Prev / Next</div>
              <div><strong>1-9</strong> — Choose option (MCQ/MSQ)</div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE bottom nav */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-100 dark:border-slate-700 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button onClick={prevQuestion} className="flex-1 px-3 py-3 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">Prev</button>
          <button onClick={saveAnswer} className="flex-1 px-3 py-3 rounded-md bg-indigo-600 text-white font-medium">Save</button>
          <button onClick={toggleMark} className="flex-1 px-3 py-3 rounded-md bg-yellow-500 text-white font-medium">Mark</button>
          <button onClick={nextQuestion} className="flex-1 px-3 py-3 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm">Next</button>
        </div>
      </div>

      {/* submit confirm modal */}
      <AnimatePresence>
        {showSubmit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900/95 rounded-xl shadow-2xl p-5 border border-slate-100 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600"><AlertCircle className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Submit Exam</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Are you sure you want to submit? You won't be able to change answers after submission.</p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setShowSubmit(false)} className="px-4 py-2 rounded-md bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">Cancel</button>
                <button onClick={() => submitExam(true)} className="px-4 py-2 rounded-md bg-rose-500 text-white">Yes, Submit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
