// components/ChangePassword.tsx
'use client';
import React, { useState } from 'react';
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast';

export default function ChangePassword() {
    const supabase = createClient()
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  // Note: Supabase client allows the logged-in user to update password via auth.updateUser
  const onChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd || newPwd !== confirmPwd) {
      toast.error('New password and confirm password must match');
      return;
    }
    setLoading(true);

    try {
      // This updates the logged-in user's password
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      toast.success('Password changed successfully. You may be asked to re-login.');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onChange} className="space-y-3">
      <div>
        <label className="text-sm">New password</label>
        <input
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded"
          minLength={6}
          required
        />
      </div>
      <div>
        <label className="text-sm">Confirm new password</label>
        <input
          type="password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <button disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
          {loading ? 'Updating...' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
