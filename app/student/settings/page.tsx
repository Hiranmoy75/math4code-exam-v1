"use client"
import React, { useState } from 'react';
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/useProfile';
import AvatarUpload from '@/components/settings/AvatarUpload';
import ChangePassword from '@/components/settings/ChangePassword';
import ForgotPassword from '@/components/settings/ForgotPassword';
import toast, { Toaster } from 'react-hot-toast';
import { createClient } from "@/lib/supabase/client"

export default function StudentSettingsPage() {
    const supabase = createClient()
  const { data: profile, isLoading, error } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  React.useEffect(() => setFullName(profile?.full_name ?? ''), [profile?.full_name]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({ full_name: fullName });
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    }
  };

  if (isLoading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load profile: {(error as any).message}</div>;
  if (!profile) return <div className="p-6">No profile found. Please login.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster />
      <h1 className="text-2xl font-semibold mb-4">Student Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* left column: profile card */}
        <div className="col-span-1 bg-white rounded-xl shadow p-5">
          <div className="flex flex-col items-center gap-4">
            <AvatarUpload currentUrl={(profile as any).avatar_url} />
            <div className="text-center">
              <div className="text-lg font-medium">{profile.full_name || 'Student'}</div>
              <div className="text-sm text-gray-500">{profile.role}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-600">Email</div>
            <div className="text-sm font-medium">{profile.email}</div>
            <div className="mt-3 text-xs text-gray-400">Member since: {new Date(profile.created_at ?? '').toLocaleDateString()}</div>
          </div>
        </div>

        {/* middle: edit profile */}
        <div className="col-span-2 bg-white rounded-xl shadow p-6">
          <form onSubmit={onSave} className="space-y-4">
            <h2 className="text-lg font-semibold">Personal information</h2>

            <div>
              <label className="block text-sm">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm">Email (readonly)</label>
              <input value={profile.email} readOnly className="mt-1 w-full px-3 py-2 border rounded bg-gray-50" />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
                Save
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 border rounded"
                onClick={async () => {
                  // sign out quick action
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
              >
                Sign out
              </button>
            </div>
          </form>

          <hr className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-medium">Change password</h3>
              <p className="text-xs text-gray-500 mb-2">Change your account password.</p>
              <ChangePassword />
            </div>

            <div className="p-4 border rounded">
              <h3 className="font-medium">Forgot password</h3>
              <p className="text-xs text-gray-500 mb-2">Send a reset password email.</p>
              <ForgotPassword />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
