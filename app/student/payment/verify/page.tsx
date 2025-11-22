'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'

export default function PaymentVerifyPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const txnId = searchParams.get('txnId')

    const { data, isLoading, error } = useQuery({
        queryKey: ['verify-payment', txnId],
        queryFn: async () => {
            if (!txnId) throw new Error('Transaction ID not found')
            const response = await fetch(`/api/payments/verify?txnId=${txnId}`)
            const result = await response.json()
            return result
        },
        enabled: !!txnId,
        retry: false,
        staleTime: 0, // Always verify fresh
    })

    const status = isLoading ? 'loading' : (data?.success && data?.status === 'success') ? 'success' : 'failed'
    const message = data?.message || (error as Error)?.message || (status === 'success' ? 'Payment successful! You have been enrolled in the test series.' : 'Payment verification failed. Please contact support.')

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center"
            >
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 mx-auto mb-4 text-indigo-600 animate-spin" />
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                            Verifying Payment
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Please wait while we confirm your payment with PhonePe...
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                            Payment Successful!
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {message}
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => router.push('/student/my-series')}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                                Go to My Series
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/student/dashboard')}
                                className="w-full"
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                            <XCircle className="w-20 h-20 mx-auto mb-4 text-red-500" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                            Payment Failed
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {message}
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => router.push('/student/all-test-series')}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/student/dashboard')}
                                className="w-full"
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    </>
                )}

                {txnId && (
                    <p className="mt-6 text-xs text-slate-400">
                        Transaction ID: {txnId}
                    </p>
                )}
            </motion.div>
        </div>
    )
}
