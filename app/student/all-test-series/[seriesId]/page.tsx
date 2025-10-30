'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Lock,
  Unlock,
  Star,
  Eye,
  Sparkles,
  Layers,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

type Exam = {
  id: string
  title: string
  subject?: string
  durationMins: number
  marks: number
  status: 'free-demo' | 'unlocked' | 'locked'
  score?: number | null
  excerpt?: string
  tags?: string[]
}

export default function TestSeriesPremiumListingPremium() {
  const supabase = createClient()
  const { seriesId } = useParams()
  const [exams, setExams] = useState<Exam[]>([])
  const [seriesInfo, setSeriesInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    async function fetchSeries() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // ✅ Fetch test series info
      const { data: series } = await supabase
        .from('test_series')
        .select('*')
        .eq('id', seriesId)
        .single()
      setSeriesInfo(series)

      // ✅ Check if user enrolled
      const { data: enrollment } = await supabase
        .from('test_series_enrollments')
        .select('*')
        .eq('test_series_id', seriesId)
        .eq('student_id', user.id)
        .maybeSingle()

      setIsEnrolled(!!enrollment)

      // ✅ Fetch exams of series
      const { data: seriesExams, error } = await supabase
        .from('test_series_exams')
        .select(`
          exam_order,
          exams:exam_id (
            id,
            title,
            duration_minutes,
            total_marks,
            start_time,
            end_time
          )
        `)
        .eq('test_series_id', seriesId)
        .order('exam_order', { ascending: true })

        console.log("seriesExams",seriesExams)

      if (error) {
        console.error('Error fetching exams:', error)
        setLoading(false)
        return
      }

      // ✅ Format exams list
      const formatted: Exam[] =
        seriesExams?.map((e: any, idx: number) => {
          let status: 'free-demo' | 'unlocked' | 'locked' = 'locked'
          if (!isEnrolled) {
            status = idx === 0 ? 'free-demo' : 'locked'
          } else {
            status = 'unlocked'
          }

          return {
            id: e.exams.id,
            title: e.exams.title,
            durationMins: e.exams.duration_minutes,
            marks: e.exams.total_marks,
            subject: 'JEE',
            excerpt: 'Practice test',
            tags: idx === 0 ? ['Demo'] : ['Full'],
            status,
          }
        }) || []

      setExams(formatted)
      setLoading(false)
    }

    fetchSeries()
  }, [seriesId, supabase])

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading...</div>
  }

  const demoCount = exams.filter((x) => x.status === 'free-demo').length
  const totalTests = exams.length
  const price = seriesInfo?.price || 1499

  function onBuySeries() {
    alert('Open purchase flow')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-white via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: header + list */}
        <div className="lg:col-span-2 space-y-6">
          <Hero
            title={seriesInfo?.title || 'Premium Test Series'}
            subtitle={`Full mocks + sectional practice • ${totalTests} tests • ${demoCount} demo${demoCount > 1 ? 's' : ''}`}
            price={price}
            onBuy={onBuySeries}
          />

          {/* Exams list */}
          <div className="space-y-4">
            {exams.map((ex, idx) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.03 }}
              >
                <TestCard
                  exam={ex}
                  onStartDemo={() => alert(`Start demo: ${ex.title}`)}
                  onOpen={() => alert(`Open exam: ${ex.title}`)}
                  onEnroll={() => alert(`Enroll test: ${ex.title}`)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <aside className="space-y-4 sticky top-20">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-3xl p-5 bg-gradient-to-br from-indigo-700/10 via-white/60 to-indigo-50/10 dark:from-indigo-900/30 dark:to-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-2xl"
          >
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Premium access
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
              Unlock the entire {totalTests}-test series
            </p>
            <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-2">
              ₹{price}
            </div>
            <button
              onClick={onBuySeries}
              className="mt-4 w-full px-4 py-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-xl"
            >
              Buy Full Series — ₹{price}
            </button>
          </motion.div>
        </aside>
      </div>
    </div>
  )
}

/* ---------------- Subcomponents ---------------- */

function Hero({ title, subtitle, price, onBuy }: { title: string; subtitle: string; price: number; onBuy: () => void }) {
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-3xl p-6 bg-gradient-to-br from-white via-indigo-50 to-sky-50 dark:from-slate-900/60 dark:via-slate-800/30 border border-slate-100 dark:border-slate-800 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            {subtitle}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Price</div>
          <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">
            ₹{price}
          </div>
          <button
            onClick={onBuy}
            className="mt-2 px-4 py-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-lg"
          >
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function TestCard({ exam, onStartDemo, onOpen, onEnroll }: { exam: Exam; onStartDemo: () => void; onOpen: () => void; onEnroll: () => void }) {
  const isDemo = exam.status === 'free-demo'
  const isLocked = exam.status === 'locked'

  return (
    <div className="rounded-2xl shadow-xl overflow-hidden border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition">
      <div className="flex-1 p-4 bg-white dark:bg-slate-900/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {exam.title}
            </h4>
            <div className="text-xs text-slate-400">
              {exam.durationMins}m • {exam.marks} marks
            </div>
            {isDemo && (
              <div className="mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Free demo
              </div>
            )}
            {isLocked && (
              <div className="mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Locked
              </div>
            )}
          </div>
          <div className="text-xs text-slate-400">{exam.status}</div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          {isDemo && (
            <>
              <button
                onClick={onStartDemo}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow"
              >
                <Play className="w-4 h-4" /> Start Demo
              </button>
              <button
                onClick={onOpen}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm"
              >
                Review
              </button>
            </>
          )}

          {!isDemo && !isLocked && (
            <button
              onClick={onOpen}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow"
            >
              <Play className="w-4 h-4" /> Start Test
            </button>
          )}

          {isLocked && (
            <button
              onClick={onEnroll}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm shadow"
            >
              <Unlock className="w-4 h-4" /> Enroll
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
