"use client"

import { Suspense } from "react"
import StatsCards from "./StatsCards"
import ExamCharts from "./ExamCharts"
import RecentAttemptsCard from "./RecentAttemptsCard"
import QuickActionsCard from "./QuickActionsCard"

interface Props {
  userId: string
}


export default function AdminDashboardClient({ userId }: Props) {
  return (
    <main className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-800/60">    

      <Suspense fallback={<div>Loading stats...</div>}>
        <StatsCards userId={userId} />
      </Suspense>

      <Suspense fallback={<div>Loading charts...</div>}>
        <ExamCharts userId={userId} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<div>Loading recent attempts...</div>}>
          <RecentAttemptsCard userId={userId} />
        </Suspense>

        <QuickActionsCard />
      </div>
    </main>
  )
}
