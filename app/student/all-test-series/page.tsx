'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Layers,
  PlayCircle,
  ShoppingBag,
  BookOpen,
  Search,
  CheckCircle,
  Loader2,
  IndianRupee,
  Eye,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { useCurrentUser } from '@/hooks/student/useCurrentUser'
import { useAllTestSeries } from '@/hooks/student/useAllTestSeries'
import { useInitiatePayment, useEnrollFreeSeries } from '@/hooks/student/usePayment'
import { useEnrollmentStatus } from '@/hooks/student/useEnrollmentStatus'

export default function AllTestSeriesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: user } = useCurrentUser()
  const { data: seriesData = [], isLoading } = useAllTestSeries()
  const { data: enrolledSeriesIds = new Set(), isLoading: enrollmentLoading } = useEnrollmentStatus(user?.id)
  const { mutate: initiatePayment, isPending: isPaymentPending } = useInitiatePayment()
  const { mutate: enrollFree, isPending: isEnrolling } = useEnrollFreeSeries()

  const filteredSeries = useMemo(() => {
    return seriesData.filter((series) => {
      const matchesSearch =
        series.title.toLowerCase().includes(search.toLowerCase()) ||
        (series.description?.toLowerCase() || '').includes(search.toLowerCase())
      return matchesSearch
    })
  }, [seriesData, search])

  const handleBuy = (series: any) => {
    if (!user) {
      toast.error('Please login to purchase')
      router.push('/auth/login')
      return
    }

    if (series.is_free) {
      enrollFree({
        seriesId: series.id,
        userId: user.id,
      })
    } else {
      initiatePayment({
        seriesId: series.id,
        amount: series.price,
        userId: user.id,
      })
    }
  }

  const handleViewDetails = (seriesId: string) => {
    router.push(`/student/all-test-series/${seriesId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-10 bg-gradient-to-br from-white via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black transition">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-10 animate-pulse">
            <div className="h-10 w-96 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-3" />
            <div className="h-4 w-[500px] bg-slate-100 dark:bg-slate-600 rounded mx-auto" />
          </div>

          {/* Search Bar Skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-14 max-w-2xl mx-auto bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-700" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-3xl p-6 bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 shadow-xl animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-6 w-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full" />
                </div>
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-600 rounded mb-2" />
                <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600 rounded mb-4" />
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-10 bg-gradient-to-br from-white via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black transition">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Explore Premium Test Series
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-3 text-sm md:text-base max-w-2xl mx-auto">
            Choose from our curated collection of test series designed by experts.
            Get instant access with secure PhonePe payments.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search test series by name or description..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 outline-none shadow-lg"
            />
          </div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredSeries.length > 0 ? (
              filteredSeries.map((series) => {
                const isEnrolled = enrolledSeriesIds.has(series.id)

                return (
                  <motion.div
                    key={series.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, scale: 0.9 },
                      visible: { opacity: 1, scale: 1 },
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative group rounded-3xl p-6 bg-gradient-to-br from-white/90 via-indigo-50/50 to-purple-50/50 
                               dark:from-slate-900/70 dark:via-slate-900 dark:to-slate-800 
                               border border-slate-200 dark:border-slate-700 
                               shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-xl"></div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">
                            {series.title}
                          </h3>
                        </div>
                        {series.is_free && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                            FREE
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                        {series.description || 'Comprehensive test series to help you excel'}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-5 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span>{series.total_exams} Tests</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>4.5</span>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          {series.is_free ? (
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                              Free
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                                {series.price.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(series.id)}
                            className="border-indigo-300 dark:border-indigo-700"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>

                          {isEnrolled ? (
                            <Button
                              size="sm"
                              onClick={() => router.push(`/student/my-series/${series.id}`)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Enrolled
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleBuy(series)}
                              disabled={isPaymentPending || isEnrolling || enrollmentLoading}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                            >
                              {isPaymentPending || isEnrolling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : series.is_free ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Enroll
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-4 h-4 mr-1" />
                                  Buy
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover Play Icon */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className="absolute right-4 top-4 bg-indigo-600 text-white rounded-full p-2 shadow-lg hidden md:flex"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </motion.div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-20"
              >
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  No test series found matching "{search}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
