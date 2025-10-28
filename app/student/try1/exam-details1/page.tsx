'use client'
import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag,
  Star,
  Shield,
  Clock,
  Check,
  CreditCard,
  Smartphone,
  Wallet,
  X,
  CheckCircle,
  Download,
} from 'lucide-react'

/**
 * TestSeriesPurchase.tsx
 * - Dummy data used
 * - Replace onConfirmCheckout() with real server/payment integration
 */

export default function TestSeriesPurchase() {
  // ----- Dummy series data -----
  const series = {
    id: 11,
    title: 'JEE Advanced — Full Mock Series (12 Tests)',
    subtitle: 'Full-length mocks, sectional tests, analytics & video solutions',
    instructor: 'Math4Code Premium',
    price: 1499, // base price (INR)
    discountPct: 20, // promotional discount percent
    taxPct: 18,
    features: [
      '12 full-length mocks (3 hrs each)',
      'Detailed solutions & stepwise explanations',
      'Performance analytics + leaderboards',
      'Sectional practice & timed tests',
      'Access on mobile & desktop',
      '24/7 doubt support (chat)',
    ],
    badge: 'Popular',
    rating: 4.7,
    reviews: 1240,
  }

  // ----- state -----
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState<'NONE' | 'APPLIED' | 'INVALID'>('NONE')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'wallet'>('card')
  const [openConfirm, setOpenConfirm] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  // ----- pricing -----
  const base = series.price
  const promoDiscount = Math.round((base * (series.discountPct || 0)) / 100)
  const couponDiscountValue = useMemo(() => {
    // dummy coupon: "M4C100" => ₹100 off ; "M4C25" => 25% off
    if (couponApplied !== 'APPLIED') return 0
    if (coupon.toUpperCase() === 'M4C100') return 100
    if (coupon.toUpperCase() === 'M4C25') return Math.round(base * 0.25)
    return 0
  }, [couponApplied, coupon, base])

  const subtotal = base - promoDiscount - couponDiscountValue
  const tax = Math.round((subtotal * series.taxPct) / 100)
  const total = subtotal + tax

  // ----- coupon handler (dummy logic) -----
  function applyCoupon() {
    const normalized = coupon.trim().toUpperCase()
    if (!normalized) return setCouponApplied('INVALID')
    if (normalized === 'M4C100' || normalized === 'M4C25') {
      setCouponApplied('APPLIED')
    } else {
      setCouponApplied('INVALID')
    }
  }

  // ----- checkout / payment (stub) -----
  async function onConfirmCheckout() {
    setOpenConfirm(false)
    setProcessing(true)

    // simulate a network / payment delay
    await new Promise((r) => setTimeout(r, 1400))

    // show success
    setProcessing(false)
    setSuccess(true)

    // here: call your payment API / server to create order and capture payment
  }

  function resetFlow() {
    setCoupon('')
    setCouponApplied('NONE')
    setPaymentMethod('card')
    setOpenConfirm(false)
    setProcessing(false)
    setSuccess(false)
  }

  // ----- small utilities -----
  const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

  // ----- UI -----
  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-white via-sky-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-black">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Hero + Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
                  JS
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">{series.title}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">{series.subtitle}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 text-xs">
                      <Star className="w-4 h-4" /> {series.rating} ({series.reviews})
                    </span>
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-xs">
                      <Tag className="w-4 h-4" /> {series.badge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-500 text-right">
                  <div>Instructor</div>
                  <div className="font-medium text-slate-800 dark:text-white">{series.instructor}</div>
                </div>

                <div className="rounded-2xl p-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow">
                  <div className="text-xs opacity-90">Price</div>
                  <div className="text-lg font-extrabold">{money(base)}</div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {series.features.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-800/30 flex items-center justify-center text-indigo-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-200">{f}</div>
                </div>
              ))}
            </div>

            {/* Promo ribbon */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-md bg-rose-50 text-rose-600 text-sm font-semibold">Limited time — {series.discountPct}% OFF</div>
                <div className="text-xs text-slate-500">Includes video solutions & analytics</div>
              </div>

              <div className="text-xs text-slate-500">Secure purchase • 7-day refund policy</div>
            </div>
          </div>

          {/* About / Guarantee / FAQs */}
          <div className="rounded-2xl p-6 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Why buy this series?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Carefully designed mocks matching the latest pattern. Detailed solutions, analytics & personalised improvement tips to help you score higher.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <div className="text-xs text-slate-500">Full-length mocks</div>
                <div className="font-semibold text-slate-800 dark:text-white">12 tests</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/20">
                <div className="text-xs text-slate-500">Video Solutions</div>
                <div className="font-semibold text-slate-800 dark:text-white">Stepwise</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/20">
                <div className="text-xs text-slate-500">Analytics</div>
                <div className="font-semibold text-slate-800 dark:text-white">Rank & Trends</div>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Money-back Guarantee</h4>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">If you don’t see value within 7 days, contact support for a full refund.</p>
            </div>

            <div className="mt-6 grid gap-3">
              <details className="p-3 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <summary className="cursor-pointer font-medium">Frequently asked questions</summary>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  <p><strong>Q:</strong> Can I access on mobile? <br/><strong>A:</strong> Yes — fully responsive and mobile app ready.</p>
                  <p className="mt-2"><strong>Q:</strong> Are solutions video-based? <br/><strong>A:</strong> Yes, for each mock you’ll get video explanations.</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Right: Checkout panel */}
        <aside className="space-y-4">
          <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-2xl p-5 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500">Your order</div>
                <div className="font-semibold text-slate-800 dark:text-white mt-1">{series.title}</div>
                <div className="text-xs text-slate-500">{series.instructor}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Price</div>
                <div className="text-lg font-extrabold">{money(base)}</div>
              </div>
            </div>

            {/* breakdown */}
            <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Base price</span><span>{money(base)}</span></div>
              <div className="flex justify-between"><span>Promo discount ({series.discountPct}%)</span><span>-{money(promoDiscount)}</span></div>
              <div className="flex justify-between"><span>Coupon</span><span>{couponApplied === 'APPLIED' ? `-${money(couponDiscountValue)}` : '-'}</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{money(Math.max(0, subtotal))}</span></div>
              <div className="flex justify-between"><span>GST ({series.taxPct}%)</span><span>{money(tax)}</span></div>
            </div>

            <div className="mt-3 flex items-center justify-between text-lg font-extrabold text-slate-800 dark:text-white">
              <div>Total</div>
              <div>{money(Math.max(0, total))}</div>
            </div>

            {/* coupon input */}
            <div className="mt-4">
              <label className="text-xs text-slate-500">Have a coupon?</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => { setCoupon(e.target.value); setCouponApplied('NONE') }}
                  placeholder="Enter coupon code (e.g. M4C100, M4C25)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-sm"
                />
                <button onClick={applyCoupon} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">Apply</button>
              </div>
              {couponApplied === 'APPLIED' && <div className="mt-2 text-sm text-green-600">Coupon applied ✓</div>}
              {couponApplied === 'INVALID' && <div className="mt-2 text-sm text-rose-500">Invalid coupon</div>}
            </div>

            {/* payment methods */}
            <div className="mt-4">
              <div className="text-sm text-slate-600 mb-2">Choose payment method</div>
              <div className="grid grid-cols-1 gap-2">
                <PaymentOption
                  id="card"
                  title="Credit / Debit Card"
                  desc="Pay with card (Visa, MasterCard, Rupay)"
                  Icon={CreditCard}
                  active={paymentMethod === 'card'}
                  onClick={() => setPaymentMethod('card')}
                />
                <PaymentOption
                  id="upi"
                  title="UPI"
                  desc="Google Pay / PhonePe / BHIM"
                  Icon={Smartphone}
                  active={paymentMethod === 'upi'}
                  onClick={() => setPaymentMethod('upi')}
                />
                <PaymentOption
                  id="wallet"
                  title="Wallet / Netbanking"
                  desc="Pay using wallet balance or netbanking"
                  Icon={Wallet}
                  active={paymentMethod === 'wallet'}
                  onClick={() => setPaymentMethod('wallet')}
                />
              </div>
            </div>

            {/* CTA */}
            <div className="mt-5">
              <button
                onClick={() => setOpenConfirm(true)}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-lg"
              >
                Proceed to pay {money(total)}
              </button>

              <div className="mt-3 text-xs text-slate-500">Safe & secure payments • 7-day refund policy</div>
            </div>
          </motion.div>

          {/* Trust / Support */}
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow text-sm">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="font-medium text-slate-800 dark:text-white">Secure payment</div>
                <div className="text-xs text-slate-500">PCI-compliant gateway</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500" />
              <div>
                <div className="font-medium text-slate-800 dark:text-white">Top-rated support</div>
                <div className="text-xs text-slate-500">24/7 chat support for students</div>
              </div>
            </div>
          </div>

          {/* small checkout CTA for mobile */}
          <div className="md:hidden rounded-2xl p-3 bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Total</div>
                <div className="font-bold text-slate-800 dark:text-white">{money(total)}</div>
              </div>
              <button onClick={() => setOpenConfirm(true)} className="px-3 py-2 rounded-lg bg-indigo-600 text-white">Pay</button>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {openConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{ scale: 0.98, y: 6 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 6 }} className="w-full max-w-md bg-white dark:bg-slate-900/95 rounded-xl p-5 shadow-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Confirm purchase</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">You will be charged {money(total)} using <span className="font-medium">{paymentMethod.toUpperCase()}</span>.</p>
                </div>
                <button onClick={() => setOpenConfirm(false)} className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex justify-between"><span>Series</span><span className="font-medium">{series.title}</span></div>
                <div className="flex justify-between"><span>Payment method</span><span className="font-medium">{paymentMethod.toUpperCase()}</span></div>
                <div className="flex justify-between"><span>Amount</span><span className="font-medium">{money(total)}</span></div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button onClick={onConfirmCheckout} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">{processing ? 'Processing...' : `Pay ${money(total)}`}</button>
                <button onClick={() => setOpenConfirm(false)} className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{ scale: 0.98, y: 6 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 6 }} className="w-full max-w-md bg-white dark:bg-slate-900/95 rounded-xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-50 text-green-700">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Payment successful</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Thank you — your access to the series is active now.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="text-sm text-slate-600 dark:text-slate-300">Order ID: <strong>M4C-{Math.floor(100000 + Math.random() * 900000)}</strong></div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Amount paid: <strong>{money(total)}</strong></div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Access: <strong>Unlocked — 12 tests</strong></div>
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={() => { alert('Download invoice (stub)'); }} className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">Invoice</button>
                <button onClick={() => { resetFlow(); }} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Done</button>
                <button onClick={() => { alert('Go to tests (stub)'); }} className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">Go to tests</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Small subcomponents ---------- */

function PaymentOption({ id, title, desc, Icon, active, onClick }: { id: string; title: string; desc: string; Icon: any; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition ${
        active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
      }`}
    >
      <div className={`p-2 rounded-md ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800/40'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-indigo-600'}`} />
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className={`text-xs ${active ? 'text-white/90' : 'text-slate-500 dark:text-slate-300'}`}>{desc}</div>
      </div>
      <div className="text-sm">
        {active ? <span className="px-2 py-1 rounded-md bg-white/20">Selected</span> : <span className="text-xs text-slate-400"> </span>}
      </div>
    </button>
  )
}
