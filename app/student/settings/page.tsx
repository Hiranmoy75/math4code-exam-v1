"use client"
import React, { useState } from 'react';
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/useProfile';
import AvatarUpload from '@/components/settings/AvatarUpload';
import ChangePassword from '@/components/settings/ChangePassword';
import ForgotPassword from '@/components/settings/ForgotPassword';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from "@/lib/supabase/client"
import { motion, Variants } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, LogOut, Mail, Calendar, Shield, BadgeCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function StudentSettingsPage() {
  const supabase = createClient()
  const { data: profile, isLoading, error } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  // Sync state when profile loads
  React.useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);


  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ full_name: fullName });
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !profile) return <div className="p-6 text-red-600">Failed to load profile. Please login.</div>;

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 max-w-6xl mx-auto space-y-8"
    >
      <Toaster />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border shadow-md overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <CardContent className="pt-0 relative px-6 pb-6">
              <div className="-mt-12 mb-4 flex justify-center">
                <AvatarUpload currentUrl={(profile as any).avatar_url} />
              </div>

              <div className="text-center space-y-1 mb-6">
                <h2 className="text-2xl font-bold text-foreground">{profile.full_name || 'Student'}</h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Mail className="h-3 w-3" />
                  <span>{profile.email}</span>
                </div>
                <div className="pt-2">
                  <Badge variant="secondary" className="capitalize px-3 py-1">
                    {profile.role}
                  </Badge>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member since
                  </span>
                  <span className="font-medium">
                    {new Date(profile.created_at ?? '').toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4" />
                    Status
                  </span>
                  <span className="font-medium text-emerald-600">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800">
                <User className="mr-2 h-4 w-4" />
                General Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800">
                <Shield className="mr-2 h-4 w-4" />
                Security & Login
              </TabsTrigger>
            </TabsList>

            {/* GENERAL TAB */}
            <TabsContent value="general" className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and public profile information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="profile-form" onSubmit={onSave} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-9"
                          placeholder="John Doe"
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground">
                        This is your public display name.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          value={profile.email}
                          readOnly
                          className="pl-9 bg-muted/50"
                        />
                      </div>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Email addresses cannot be changed directly. Contact support for help.
                      </p>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-end border-t border-border px-6 py-4 bg-muted/20">
                  <Button type="submit" form="profile-form" disabled={saving}>
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* SECURITY TAB */}
            <TabsContent value="security" className="space-y-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password to keep your account secure.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePassword />
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Account Recovery</CardTitle>
                  <CardDescription>
                    Send a password reset link to your email if you forgot your password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ForgotPassword />
                </CardContent>
              </Card>

              <Card className="border-red-100 dark:border-red-900 shadow-sm bg-red-50/30 dark:bg-red-900/10">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  <CardDescription className="text-red-600/80 dark:text-red-400/80">
                    Sign out of your account on this device.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleSignOut} className="w-full sm:w-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}
