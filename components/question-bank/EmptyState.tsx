import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 text-center">
      <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-indigo-700 border border-indigo-200">
        No questions yet
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
        Start by adding your first question. Create MCQ, MSQ, and NAT with explanations and tags.
      </p>
      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onCreate}>
        <Sparkles className="mr-2 h-4 w-4" />
        Create Question
      </Button>
    </motion.div>
  )
}
