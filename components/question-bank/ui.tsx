import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function Pill({
  children,
  color = "blue",
  className,
}: {
  children: React.ReactNode
  color?: "mint" | "blue" | "amber" | "pink" | "violet" | "red" | "gray"
  className?: string
}) {
  const map: Record<string, string> = {
    mint: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    gray: "bg-slate-50 text-slate-700 border-slate-200",
  }
  return (
    <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs", map[color], className)}>
      {children}
    </Badge>
  )
}

export const pageBg =
  "bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black"
export const cardGlass =
  "rounded-3xl border shadow-sm backdrop-blur bg-white/90 dark:bg-slate-900/60"
