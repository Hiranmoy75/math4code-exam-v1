'use client'
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  Layers,
  PlayCircle,
  ShoppingBag,
  BookOpen,
  Filter,
  Search,
} from 'lucide-react'

type TestSeries = {
  id: number
  title: string
  examType: string
  subject: string
  description: string
  tests: number
  price: number
  discount?: number
  rating: number
  badge?: string
  freeTests?: number
  level?: string
}

const DUMMY_SERIES: TestSeries[] = [
  {
    id: 1,
    title: 'JEE Advanced 2025 Mega Series',
    examType: 'JEE',
    subject: 'Physics • Chemistry • Maths',
    description:
      '12 full-length mocks with detailed solutions and analytics dashboard.',
    tests: 12,
    price: 1499,
    discount: 20,
    rating: 4.8,
    badge: 'Top Rated',
    freeTests: 2,
    level: 'Advanced',
  },
  {
    id: 2,
    title: 'IIT JAM Mathematics Series',
    examType: 'JAM',
    subject: 'Mathematics',
    description:
      '10 mock tests covering full IIT JAM syllabus with leaderboard & reports.',
    tests: 10,
    price: 999,
    rating: 4.7,
    badge: 'Popular',
    freeTests: 1,
    level: 'Graduate',
  },
  {
    id: 3,
    title: 'GATE Computer Science Pro Pack',
    examType: 'GATE',
    subject: 'CSE / IT',
    description:
      '8 premium tests, sectional analysis and personalized score reports.',
    tests: 8,
    price: 1299,
    discount: 15,
    rating: 4.9,
    badge: 'New',
    freeTests: 1,
    level: 'Expert',
  },
  {
    id: 4,
    title: 'CSIR NET Physical Science Test Series',
    examType: 'CSIR NET',
    subject: 'Physics',
    description:
      'Conceptual & numerical questions for CSIR NET Physical Science.',
    tests: 10,
    price: 1199,
    rating: 4.6,
    badge: 'Advanced',
    freeTests: 1,
    level: 'Postgraduate',
  },
  {
    id: 5,
    title: 'SSC CGL Quantitative Aptitude Series',
    examType: 'SSC CGL',
    subject: 'Mathematics',
    description:
      'Chapter-wise + full mock tests for Tier-1 preparation with solutions.',
    tests: 20,
    price: 799,
    rating: 4.6,
    badge: 'Value Pack',
    freeTests: 2,
    level: 'Intermediate',
  },
]

export default function AllTestSeriesPage() {
  const [selectedExam, setSelectedExam] = useState<string>('All')
  const [search, setSearch] = useState('')

  const filteredSeries = useMemo(() => {
    return DUMMY_SERIES.filter((series) => {
      const matchesExam =
        selectedExam === 'All' || series.examType === selectedExam
      const matchesSearch =
        series.title.toLowerCase().includes(search.toLowerCase()) ||
        series.subject.toLowerCase().includes(search.toLowerCase())
      return matchesExam && matchesSearch
    })
  }, [selectedExam, search])

  const exams = ['All', 'JEE', 'JAM', 'GATE', 'CSIR NET', 'SSC CGL']

  function handleViewDetails(series: TestSeries) {
    alert(`Open details page for: ${series.title}`)
    // router.push(`/test-series/${series.id}`)
  }

  const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-br from-white via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black transition">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Explore All Premium Test Series
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm md:text-base">
            Filter by exam type and find your perfect test series with analytics,
            video solutions, and free demos.
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or subject..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-800 outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-end">
            {exams.map((exam) => (
              <button
                key={exam}
                onClick={() => setSelectedExam(exam)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition ${
                  selectedExam === exam
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Filter className="w-4 h-4" /> {exam}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSeries.length > 0 ? (
            filteredSeries.map((series) => (
              <motion.div
                key={series.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.03 }}
                className="relative group rounded-3xl p-6 bg-gradient-to-br from-white/90 via-indigo-50 to-sky-50 
                           dark:from-slate-900/70 dark:via-slate-900 dark:to-slate-800 
                           border border-slate-100 dark:border-slate-700 
                           shadow-xl hover:shadow-2xl transition overflow-hidden"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-xl"></div>

                {/* Header */}
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      {series.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {series.examType} • {series.subject}
                    </p>
                  </div>
                  {series.badge && (
                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                      {series.badge}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 relative z-10">
                  {series.description}
                </p>

                {/* Info */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm relative z-10">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Layers className="w-4 h-4 text-indigo-500" /> {series.tests}{' '}
                    Tests
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Star className="w-4 h-4 text-amber-500" /> {series.rating}
                  </div>
                </div>

                {/* Price */}
                <div className="mt-5 flex items-center justify-between relative z-10">
                  <div>
                    <div className="text-xs text-slate-500">Starting from</div>
                    <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                      {money(series.price)}
                      {series.discount && (
                        <span className="ml-2 text-xs text-rose-500 font-semibold">
                          -{series.discount}%
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(series)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:brightness-110 transition"
                  >
                    <BookOpen className="w-4 h-4" /> View Details
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between relative z-10 text-xs text-slate-500">
                  <div className="flex gap-2">
                    {series.freeTests && (
                      <span className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        {series.freeTests} Free Demos
                      </span>
                    )}
                    {series.level && (
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {series.level}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => alert('Buy now flow')}
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold"
                  >
                    <ShoppingBag className="w-4 h-4" /> Buy
                  </button>
                </div>

                {/* Hover Play Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute right-4 bottom-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg hidden md:flex"
                >
                  <PlayCircle className="w-5 h-5" />
                </motion.div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">
              No test series found for "{selectedExam}" matching "{search}".
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
