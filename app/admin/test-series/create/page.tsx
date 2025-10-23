"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import TestSeriesFormSkeleton from "./components/TestSeriesFormSkeleton"

export default function CreateTestSeriesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "0",
    is_free: true,
  })

  // ✅ Load user instantly without blocking render
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
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("test_series")
        .insert([
          {
            admin_id: userId,
            title: formData.title,
            description: formData.description,
            price: formData.is_free ? 0 : Number.parseFloat(formData.price),
            is_free: formData.is_free,
            status: "draft",
          },
        ])
        .select()

      if (error) throw error
      router.push(`/admin/test-series/${data[0].id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ⚡ Instant skeleton before Supabase loads
  if (!isReady) {
    return (
      <TestSeriesFormSkeleton/>
    )
  }

  // ✅ Main Form (loads instantly after skeleton)
  return (
    <div className="max-w-2xl mx-auto transition-opacity duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Create Test Series</CardTitle>
          <CardDescription>Create a new test series to bundle multiple exams</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Series Title *</Label>
              <Input
                id="title"
                placeholder="e.g., JEE Main Full Course"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this test series covers"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                />
                Free Series
              </Label>
            </div>

            {!formData.is_free && (
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Series"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
