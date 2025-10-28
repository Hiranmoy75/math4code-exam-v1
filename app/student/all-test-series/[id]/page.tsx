'use client'
import React from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Lock,
  Unlock,
  Star,
  ShoppingCart,
  Eye,
  Download,
  Sparkles,
  Layers,
} from 'lucide-react'

type Exam = {
  id: number
  title: string
  subject?: string
  durationMins: number
  marks: number
  status: 'free-demo' | 'unlocked' | 'locked'
  score?: number | null
  excerpt?: string
  tags?: string[]
}

const DUMMY_EXAMS: Exam[] = [
  { id: 1, title: 'Full Mock 01 — Physics', subject: 'Physics', durationMins: 180, marks: 300, status: 'free-demo', score: 210, excerpt: 'Full-length JEE style mock with sectional timers', tags: ['Full-length', 'Video'] },
  { id: 2, title: 'Full Mock 02 — Chemistry', subject: 'Chemistry', durationMins: 180, marks: 300, status: 'free-demo', score: null, excerpt: 'Video solutions included', tags: ['Video', 'Demo'] },
  { id: 3, title: 'Mock 03 — Mathematics', subject: 'Mathematics', durationMins: 180, marks: 300, status: 'locked', excerpt: 'Strict timed test with analytics' },
  { id: 4, title: 'Mock 04 — Physics Sectional', subject: 'Physics', durationMins: 60, marks: 100, status: 'locked', excerpt: 'Sectional practice — focused topics' },
  { id: 5, title: 'Mock 05 — Chemistry Sectional', subject: 'Chemistry', durationMins: 60, marks: 100, status: 'locked', excerpt: 'Concept & speed practice' },
  { id: 6, title: 'Mock 06 — Mathematics Sectional', subject: 'Mathematics', durationMins: 60, marks: 100, status: 'locked', excerpt: 'Advanced problems set' },
]

export default function TestSeriesPremiumListingPremium() {
  const exams = DUMMY_EXAMS
  const price = 1499
  const demoCount = exams.filter((x) => x.status === 'free-demo').length
  const totalTests = exams.length

  function onStartDemo(e: Exam) {
    alert(`Start demo: ${e.title} — replace with navigation to exam start page.`)
  }

  function onOpenExam(e: Exam) {
    if (e.status === 'locked') {
      alert('This test is locked. Please enroll / buy to unlock.')
    } else {
      alert(`Open exam: ${e.title}`)
    }
  }

  function onBuySeries() {
    alert('Open purchase flow — replace with real checkout.')
  }

  function onEnrollSingle(e: Exam) {
    alert(`Enroll single test: ${e.title} — implement enroll API.`)
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-white via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: header + list */}
        <div className="lg:col-span-2 space-y-6">
          <Hero
            title="JEE Advanced — Premium Test Series"
            subtitle={`Full mocks + sectional practice • ${totalTests} tests • ${demoCount} demo${demoCount > 1 ? 's' : ''}`}
            price={price}
            onBuy={onBuySeries}
          />

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                placeholder="Search tests (Physics, Mock 01...)"
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/40 transition"
              />
            </div>

            <div className="flex gap-2">
              <FilterButton active>All</FilterButton>
              <FilterButton>Free Demos</FilterButton>
              <FilterButton>Sectional</FilterButton>
            </div>
          </div>

          {/* Exams list */}
          <div className="space-y-4">
            {exams.map((ex) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: ex.id * 0.03 }}
              >
                <TestCard
                  exam={ex}
                  onStartDemo={() => onStartDemo(ex)}
                  onOpen={() => onOpenExam(ex)}
                  onEnroll={() => onEnrollSingle(ex)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: premium panel */}
        <aside className="space-y-4 sticky top-20">
          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-3xl p-5 bg-gradient-to-br from-indigo-700/10 via-white/60 to-indigo-50/10 dark:from-indigo-900/30 dark:to-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-xl">
                JS
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Premium access</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Unlock the entire {totalTests}-test series</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Now</div>
                    <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">₹{price}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Video solutions for every mock</div>
                  <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-600" /> PDF solutions & reports</div>
                  <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-slate-500" /> Timed mode & integrity checks</div>
                </div>

                <div className="mt-4 grid gap-3">
                  <button onClick={onBuySeries} className="w-full px-4 py-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-xl transform hover:scale-[1.01] transition">Buy Full Series — ₹{price}</button>
                  <button onClick={() => alert('Have coupon?')} className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">Have coupon?</button>
                </div>

                <div className="mt-3 text-xs text-slate-500">Free demos: {demoCount} • Refund policy: 7 days</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl p-4 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Quick actions</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white">Jump to</div>
              </div>
              <div className="text-sm text-slate-500">Pro</div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => alert('View analytics (stub)')} className="w-full px-3 py-2 rounded-xl bg-indigo-600 text-white">View Analytics</button>
              <button onClick={() => alert('Open leaderboards (stub)')} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">Leaderboards</button>
            </div>
          </motion.div>

          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl p-4 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow text-sm">
            <div className="font-medium text-slate-800 dark:text-white">About this series</div>
            <div className="mt-2 text-xs text-slate-500">Full-length mocks modeled on current pattern with sectional timers, video solutions, and performance analytics.</div>
            <div className="mt-3">
              <button onClick={() => alert('Chat support (stub)')} className="w-full px-3 py-2 rounded-xl bg-indigo-600 text-white">Chat with support</button>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  )
}

/* ---------------- Subcomponents ---------------- */

function Hero({ title, subtitle, price, onBuy }: { title: string; subtitle: string; price: number; onBuy: () => void }) {
  return (
    <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-3xl p-6 bg-gradient-to-br from-white via-indigo-50 to-sky-50 dark:from-slate-900/60 dark:via-slate-800/30 border border-slate-100 dark:border-slate-800 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-xl shadow-xl">JS</div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">{subtitle}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 text-xs inline-flex items-center gap-1"><Star className="w-4 h-4" /> 4.7</div>
              <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs inline-flex items-center gap-1">Popular</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-xs text-slate-500">Price</div>
          <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">₹{price}</div>
          <div className="flex gap-2">
            <button onClick={onBuy} className="px-4 py-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-lg">Buy Now</button>
            <button onClick={() => alert('Preview series (stub)')} className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">Preview</button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FilterButton({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button className={`px-3 py-2 rounded-2xl text-sm font-medium transition ${active ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'}`}>
      {children}
    </button>
  )
}

function TestCard({ exam, onStartDemo, onOpen, onEnroll }: { exam: Exam; onStartDemo: () => void; onOpen: () => void; onEnroll: () => void }) {
  const isDemo = exam.status === 'free-demo'
  const isLocked = exam.status === 'locked'
  const accent = isDemo ? 'from-emerald-400 to-emerald-600' : 'from-indigo-500 to-purple-600'

  return (
    <div className="rounded-2xl shadow-xl overflow-hidden border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition">
      <div className="flex items-stretch">
        {/* left accent */}
        <div className={`hidden md:flex w-1.5 bg-gradient-to-b ${accent}`} />

        {/* main */}
        <div className="flex-1 p-4 bg-white dark:bg-slate-900/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-semibold">
                {exam.subject?.slice(0, 1) ?? 'T'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{exam.title}</h4>
                  <div className="text-xs text-slate-400">{exam.durationMins}m • {exam.marks}m</div>
                  {isDemo && <div className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Free demo</div>}
                  {isLocked && <div className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Locked</div>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 max-w-xl">{exam.excerpt}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {exam.tags?.map((t) => <span key={t} className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{t}</span>)}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-slate-400">Status</div>
              <div className="text-sm font-medium">
                {isDemo ? <span className="text-emerald-600">Demo</span> : isLocked ? <span className="text-slate-600">Locked</span> : <span className="text-indigo-700">Unlocked</span>}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* score badge */}
              {exam.score != null && <div className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">Score {exam.score}</div>}
              <div className="text-xs text-slate-400">Practice • timed</div>
            </div>

            <div className="flex items-center gap-2">
              {isDemo && (
                <>
                  <button onClick={onStartDemo} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow hover:brightness-95 transition">
                    <Play className="w-4 h-4" /> Start
                  </button>
                  <button onClick={onOpen} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">Review</button>
                </>
              )}

              {!isDemo && !isLocked && (
                <>
                  <button onClick={onOpen} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow">
                    <Play className="w-4 h-4" /> Resume
                  </button>
                  <button onClick={onOpen} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">Review</button>
                </>
              )}

              {isLocked && (
                <>
                  <button onClick={onEnroll} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm shadow">
                    <Unlock className="w-4 h-4" /> Enroll
                  </button>
                  <button onClick={() => alert('Preview sample questions (stub)')} className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
