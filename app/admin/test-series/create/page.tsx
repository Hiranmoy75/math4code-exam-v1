"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useExams } from "@/hooks/useExams"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, ArrowLeft, Layers, IndianRupee, FileText } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import TestSeriesFormSkeleton from "./components/TestSeriesFormSkeleton"

export default function CreateTestSeriesPage() {
  const router = useRouter()
  const supabase = createClient()

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [_, setLoadingLegacy] = useState(false)
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const [isReady, setIsReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    is_free: true,
  })

  const { createTestSeries, isCreatingTestSeries } = useExams()

  // Load user instantly without blocking render
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      setIsReady(true)
    }
    fetchUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Please enter a title for the test series")
      return
    }

    if (!formData.is_free && (!formData.price || Number(formData.price) <= 0)) {
      toast.error("Please enter a valid price")
      return
    }

    try {
      const data = await createTestSeries({
        title: formData.title,
        description: formData.description,
        price: formData.is_free ? 0 : Number.parseFloat(formData.price),
        is_free: formData.is_free,
        status: "draft",
      });

      // Navigate on success
      router.push(`/admin/test-series/${data.id}`)
    } catch (err: any) {
      console.error(err)
      // Hook handles toast, but we can log
    }
  }

  // Instant skeleton before Supabase loads
  if (!isReady) {
    return <TestSeriesFormSkeleton />
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            className="pl-0 hover:pl-2 transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Test Series
          </Button>
        </div>

        <Card className="border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create Test Series</CardTitle>
                <CardDescription>Bundle multiple exams into a structured learning path</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">Series Title <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="title"
                      placeholder="e.g., JEE Mains Comprehensive Series 2025"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="pl-9 h-11 text-base"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what students will learn from this series..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    className="resize-none text-base"
                  />
                </div>

                <div className="pt-4 pb-2">
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Free Series</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Make this test series available to all students for free
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_free}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                    />
                  </div>
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: formData.is_free ? 0 : "auto",
                    opacity: formData.is_free ? 0 : 1,
                    marginBottom: formData.is_free ? 0 : 16
                  }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="price" className="text-base font-medium">Price (₹) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="price"
                        type="number"
                        placeholder="999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        min="0"
                        step="0.01"
                        className="pl-9 h-11 text-base font-medium"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Set a competitive price for your premium content.</p>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingTestSeries}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                >
                  {isCreatingTestSeries ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Series"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
