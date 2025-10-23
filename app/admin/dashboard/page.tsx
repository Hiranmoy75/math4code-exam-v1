"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import AdminDashboardClient from "./components/AdminDashboardClient"
import Loading from "./components/Loading"

export default function AdminDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  if (!userId) return <Loading/>

  return <AdminDashboardClient userId={userId} />
}
