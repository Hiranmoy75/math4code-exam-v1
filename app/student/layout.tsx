import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { BookOpen, BarChart3, LogOut, Home, Grid } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconBrandTabler, IconUserBolt } from "@tabler/icons-react"
import AdminClientLayout from "../admin/AdminClientLayout"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "student") {
    redirect("/admin/dashboard")
  }

  const handleLogout = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

   const links = [
    { icon: "home", label: "Dashboard", href: "/student/dashboard" },
    { icon: "book", label: "My Series", href: "/student/my-series"},    
    { icon: "book", label: "Result", href: "/student/results"},    
    { icon: "book", label: "All Series", href: "/student/all-test-series"},    
  ];

return <AdminClientLayout profile={profile} links={links}>{children}</AdminClientLayout>;
}
