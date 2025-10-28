'use client'
import React from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Clock,
  Users,
  BarChart2,
  CheckCircle2,
  Download,
  Star,
  MapPin,
} from 'lucide-react'

/**
 * TestSeriesView.tsx
 * - Shows series overview, progress, list of tests with statuses
 * - Mobile & Desktop responsive
 * - Dummy data included
 * - Replace navigation stubs with your router / API calls
 */

type TestItem = {
  id: number
  title: string
  subject?: string
  durationMins: number
  marks: number
  status: 'Locked' | 'Not Started' | 'Ongoing' | 'Completed'
  score?: number | null
  takenAt?: string | null // ISO date
}

const DUMMY_SERIES = {
  id: 11,
  title: 'JEE Advanced 2025 Test Series',
  subtitle: 'Full-length + Sectional mocks (Physics • Chemistry • Math)',
  instructor: 'Math4Code Premium',
  price: '₹1,499',
  color: 'from-indigo-500 to-purple-600',
  totalTests: 12,
  completed: 6,
  averageScore: 72,
  studentsEnrolled: 1240,
  nextTestDate: '2025-11-05',
  tests: [
    { id: 1, title: 'Mock 01 — Physics', subject: 'Physics', durationMins: 180, marks: 300, status: 'Completed', score: 265, takenAt: '2025-10-01' },
    { id: 2, title: 'Mock 02 — Chemistry', subject: 'Chemistry', durationMins: 180, marks: 300, status: 'Completed', score: 240, takenAt: '2025-10-03' },
    { id: 3, title: 'Mock 03 — Mathematics', subject: 'Mathematics', durationMins: 180, marks: 300, status: 'Ongoing', score: null, takenAt: null },
    { id: 4, title: 'Mock 04 — Full Syllabus', subject: 'All', durationMins: 180, marks: 300, status: 'Not Started', score: null, takenAt: null },
    { id: 5, title: 'Mock 05 — Physics', subject: 'Physics', durationMins: 180, marks: 300, status: 'Locked', score: null, takenAt: null },
    // ... can add up to totalTests
  ] as TestItem[],
}

export default function TestSeriesView() {
  const series = DUMMY_SERIES

  // stub navigation / action handlers
  function onStartTest(test: TestItem) {
    // replace with router push to /exam/start or open modal
    alert(`Start / Resume test: ${test.title} (id: ${test.id}) — replace with real navigation.`)
  }

  function onViewLeaderboard() {
    alert('Open leaderboard — implement actual page/modal.')
  }

  function onDownloadPDF() {
    alert('Download report (stub) — implement server/pdf generation.')
  }

  const progressPct = Math.round((series.completed / series.totalTests) * 100)

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-black transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className={`rounded-2xl w-16 h-16 flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br ${series.color}`}>
            JS
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
              {series.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
              {series.subtitle}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 font-medium">Premium</span>
              <span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{series.instructor}</span>
              <span className="text-xs px-2 py-1 rounded-md bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">{series.studentsEnrolled} students</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onViewLeaderboard} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-sm text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" /> Leaderboard
          </button>
          <button onClick={onDownloadPDF} className="px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-sm text-sm flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
          <div className="text-xs text-slate-500">Progress</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{series.completed}/{series.totalTests}</div>
              <div className="text-xs text-slate-500 mt-1">Tests completed</div>
            </div>
            <div className="w-24 h-24 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-16 h-16">
                <path
                  className="text-slate-200"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d={describeArcPath(18, 18, 15.5, 0, (progressPct / 100) * 360)}
                  fill="none"
                  stroke="url(#grad1)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <text x="18" y="20.7" textAnchor="middle" fontSize="6" fill="#0f172a" className="dark:fill-white">{progressPct}%</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
          <div className="text-xs text-slate-500">Average Score</div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{series.averageScore}%</div>
            <div className="text-xs text-slate-500 mt-1">Across attempts</div>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
          <div className="text-xs text-slate-500">Next Test</div>
          <div className="mt-2">
            <div className="text-lg font-semibold text-slate-800 dark:text-white">{formatDate(series.nextTestDate)}</div>
            <div className="text-xs text-slate-500 mt-1">Don't miss it</div>
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
          <div className="text-xs text-slate-500">Price</div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{series.price}</div>
            <div className="text-xs text-slate-500 mt-1">One-time</div>
          </div>
        </div>
      </div>

      {/* Description + CTA */}
      <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="text-sm text-slate-700 dark:text-slate-200">
          <p className="mb-2">This premium series contains full-length mocks and sectional tests designed for JEE Advanced 2025 pattern. Includes detailed solutions and explanations after submission.</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> Full-length + sectional</div>
            <div className="flex items-center gap-1"><Users className="w-4 h-4" /> {series.studentsEnrolled} students</div>
            <div className="flex items-center gap-1"><BarChart2 className="w-4 h-4" /> Analytics & reports</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onViewLeaderboard} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-sm">View Leaderboard</button>
          <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-sm" onClick={() => alert('Enroll / Buy flow (stub)')}>
            Enroll Now — {series.price}
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: tests list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Tests in this series</h3>
          <div className="space-y-3">
            {series.tests.map((t) => (
              <motion.div key={t.id} whileHover={{ scale: 1.01 }} className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-semibold">
                    {t.subject?.slice(0,1) ?? 'T'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-white">{t.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.subject} • {t.durationMins} mins • {t.marks} marks</div>
                    <div className="mt-2 flex gap-2 items-center">
                      <span className={`text-xs px-2 py-1 rounded-md ${statusBadgeClass(t.status)}`}>{t.status}</span>
                      {t.status === 'Completed' && t.score != null && <span className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800">Score: <strong className="ml-1 text-indigo-700 dark:text-indigo-300">{t.score}</strong></span>}
                      {t.takenAt && <span className="text-xs text-slate-400">• {formatDate(t.takenAt)}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {t.status === 'Locked' ? (
                    <button className="px-3 py-2 rounded-lg bg-slate-200 text-slate-600 text-sm" onClick={() => alert('Locked — complete previous tests')}>
                      Locked
                    </button>
                  ) : (
                    <>
                      <button onClick={() => onStartTest(t)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-2">
                        <Play className="w-4 h-4" /> {t.status === 'Ongoing' ? 'Resume' : (t.status === 'Completed' ? 'Review' : 'Start')}
                      </button>

                      <button onClick={() => alert('View details (stub)')} className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-sm">Details</button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Analytics mini */}
          <div className="mt-6 rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Quick Analytics</h4>
              <div className="text-xs text-slate-500">Last 30 days</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 bg-indigo-50 dark:bg-indigo-900/30">
                <div className="text-xs text-slate-600">Avg Accuracy</div>
                <div className="text-lg font-bold">72%</div>
              </div>
              <div className="rounded-lg p-3 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-600">Avg Time/Test</div>
                <div className="text-lg font-bold">2h 45m</div>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600">Tip: Click <span className="font-medium">Review</span> on completed tests to see question-wise explanations and improvement points.</div>
          </div>
        </div>

        {/* Right column: progress + actions */}
        <aside className="space-y-4">
          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Series Progress</div>
                <div className="text-lg font-semibold text-slate-800 dark:text-white">{series.completed}/{series.totalTests} completed</div>
              </div>
              <div className="text-xs text-slate-500">{progressPct}%</div>
            </div>

            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div style={{ width: `${progressPct}%` }} className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => alert('Open analytics (stub)')} className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white">View Analytics</button>
              <button onClick={() => alert('Open discussion (stub)')} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">Discussions</button>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
            <div className="text-sm text-slate-600">Badges</div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <div className="px-3 py-2 rounded-md bg-amber-50 text-amber-700 text-xs flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Top 10%</div>
              <div className="px-3 py-2 rounded-md bg-green-50 text-green-700 text-xs flex items-center gap-2">Consistency</div>
              <div className="px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 text-xs flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Live Rank</div>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow text-sm">
            <div className="text-xs text-slate-500">Series Info</div>
            <div className="mt-2 space-y-1">
              <div><strong>Total Tests:</strong> {series.totalTests}</div>
              <div><strong>Duration:</strong> 3 hrs / test</div>
              <div><strong>Format:</strong> MCQ • MSQ • NAT</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ---------- Helpers ---------- */

// small helper to get badge classes
function statusBadgeClass(s: TestItem['status']) {
  switch (s) {
    case 'Completed': return 'bg-green-100 text-green-700'
    case 'Ongoing': return 'bg-yellow-100 text-yellow-700'
    case 'Not Started': return 'bg-slate-100 text-slate-700'
    case 'Locked': return 'bg-slate-200 text-slate-600'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatDate(iso?: string | null) {
  if (!iso) return 'TBD'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

/**
 * draw arc path for svg circle progress (centerX centerY r startAngle endAngle)
 * returned path uses polar coordinates -> converted to SVG arc path
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  }
}
function describeArcPath(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  const d = [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ")
  return d
}
