import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">math4code</h1>
        <p className="text-xl text-gray-700 mb-8">Premium online exam system for IIT JEE and IIT JAM preparation</p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button size="lg" variant="default">
              Login
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="outline">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
