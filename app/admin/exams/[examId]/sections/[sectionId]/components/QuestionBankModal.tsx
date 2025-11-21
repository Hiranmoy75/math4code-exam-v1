"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { MathJax } from "better-react-mathjax";
import {
  Search,
  Plus,
  Loader2,
  FileQuestion,
  Award,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

interface Props {
  show: boolean;
  setShow: (val: boolean) => void;
  sectionId: string;
  reloadQuestions: () => void;
}

export default function QuestionBankModal({ show, setShow, sectionId, reloadQuestions }: Props) {
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [existingQuestionIds, setExistingQuestionIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [addingQuestionId, setAddingQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        // Load existing questions in ALL sections of this exam
        // First get the exam_id from the section
        const { data: sectionData } = await supabase
          .from("sections")
          .select("exam_id")
          .eq("id", sectionId)
          .single();

        if (sectionData) {
          // Get all sections of this exam
          const { data: examSections } = await supabase
            .from("sections")
            .select("id")
            .eq("exam_id", sectionData.exam_id);

          const sectionIds = examSections?.map(s => s.id) || [];

          // Get all questions from all sections of this exam
          const { data: existingQuestions } = await supabase
            .from("questions")
            .select("question_bank_id")
            .in("section_id", sectionIds);

          const existingIds = new Set(
            existingQuestions
              ?.map(q => q.question_bank_id)
              .filter(id => id !== null) || []
          );
          setExistingQuestionIds(existingIds);
        }

        // Load question bank
        const { data, error: bankError } = await supabase
          .from("question_bank")
          .select("*")
          .order("created_at", { ascending: false });

        if (bankError) throw bankError;
        setBankQuestions(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load question bank");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [show, sectionId]);

  const handleAddQuestion = async (bankQuestionId: string) => {
    try {
      setAddingQuestionId(bankQuestionId);
      setError(null);

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("add_question_with_options", {
        p_section_id: sectionId,
        p_question_bank_id: bankQuestionId,
      });

      if (rpcError) throw rpcError;

      // Add to existing IDs to prevent re-adding
      setExistingQuestionIds(prev => new Set([...prev, bankQuestionId]));

      setSuccessMessage("Question added successfully!");
      setTimeout(() => setSuccessMessage(null), 2000);

      await reloadQuestions();
    } catch (err: any) {
      setError(err.message || "Failed to add question");
    } finally {
      setAddingQuestionId(null);
    }
  };

  const getQuestionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      mcq: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      numerical: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      subjective: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[type?.toLowerCase()] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  };

  const filteredQuestions = bankQuestions.filter(q => {
    const matchesSearch =
      q.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || q.question_type?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const questionTypes = ["all", ...new Set(bankQuestions.map(q => q.question_type?.toLowerCase()).filter(Boolean))];

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileQuestion className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Question Bank
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Select questions from your bank. Questions already added to any section in this exam are disabled.
          </DialogDescription>

          {/* Search and Filter */}
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search questions by title, text, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {questionTypes.map(type => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className={filterType === type ? "bg-indigo-600" : ""}
                >
                  {type === "all" ? "All" : type.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions List - Fixed Scroll with LaTeX Support */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <FileQuestion className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {searchQuery || filterType !== "all" ? "No questions match your filters" : "No questions in your bank yet"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                {searchQuery || filterType !== "all" ? "Try adjusting your search or filters" : "Create questions in the question bank first"}
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {filteredQuestions.map((q, index) => {
                const isAlreadyAdded = existingQuestionIds.has(q.id);
                const isAdding = addingQuestionId === q.id;

                return (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${isAlreadyAdded
                        ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg"
                      }`}
                  >
                    {isAlreadyAdded && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Added to Exam
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                          <MathJax>{q.title || "Untitled Question"}</MathJax>
                        </h4>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          <MathJax>{q.question_text}</MathJax>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getQuestionTypeColor(q.question_type)}>
                            {q.question_type?.toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Award className="w-4 h-4" />
                            <span className="font-medium">{q.marks} marks</span>
                          </div>
                          {q.subject && (
                            <Badge variant="outline" className="text-xs">
                              {q.subject}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={isAlreadyAdded || isAdding}
                        onClick={() => handleAddQuestion(q.id)}
                        className={
                          isAlreadyAdded
                            ? "bg-slate-300 dark:bg-slate-700"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : isAlreadyAdded ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {filteredQuestions.length} {filteredQuestions.length === 1 ? "question" : "questions"} available
              {existingQuestionIds.size > 0 && ` • ${existingQuestionIds.size} already in exam`}
            </p>
            <Button variant="outline" onClick={() => setShow(false)}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
