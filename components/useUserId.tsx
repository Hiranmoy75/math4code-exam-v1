"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"

export default function useUserId() {
  const supabase = createClientComponentClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return null
      setUserId(data.user?.id )
    }
    getUser()
  }, [supabase])

  return userId
}
