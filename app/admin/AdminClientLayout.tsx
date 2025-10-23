"use client";

import { useState } from "react";
import { SidebarDemo } from "@/components/sidebar/SidebarDemo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default function AdminClientLayout({
  profile,
  links,
  children,
}: {
  profile: any;
  links:any;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect("/auth/login");
  };

  return (
    <div className="min-h-screen w-full flex text-[var(--foreground-color)] bg-[var(--background-color)]">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen border-r border-[var(--sidebar-border)] z-50 transition-all duration-300 ${
          open ? "w-[220px]" : "w-[72px]"
        } bg-[var(--sidebar)] text-[var(--sidebar-foreground)]`}
      >
        <SidebarDemo open={open} setOpen={setOpen} links={links} profile={profile} />
      </div>

      {/* Main content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
          open ? "ml-[220px]" : "ml-[72px]"
        }`}
      >
        <header className="flex items-center justify-between border-b border-[var(--sidebar-border)] px-6 py-4 bg-[var(--background-color)] text-[var(--foreground-color)]">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-blue-600">math4code</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {profile.full_name || profile.email}
            </span>
            <form action={handleLogout}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[var(--background-color)]">
          {children}
        </main>
      </div>
    </div>
  );
}
