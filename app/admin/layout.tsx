import type React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClientLayout from "./AdminClientLayout";
import { Home, Grid, BarChart2, User, Settings } from "lucide-react";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/student/dashboard");
  }
 const links = [
    { icon: "home", label: "Dashboard", href: "/admin/dashboard" },
    { icon: "question", label: "Question Bank", href: "/admin/question-bank" },
    { icon: "grid", label: "Exam", href: "/admin/exams" },
    { icon: "book", label: "Test Series", href: "/admin/test-series" },
    { icon: "user", label: "Students" , href: "/admin/students" },
    { icon: "settings", label: "Settings" ,href: "/admin/settings"},
  ];

  return <AdminClientLayout profile={profile} links={links}>{children}</AdminClientLayout>;
}
