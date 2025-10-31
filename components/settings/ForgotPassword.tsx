// components/ForgotPassword.tsx
'use client';
import React, { useState } from 'react';
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSend = async (e: React.FormEvent) => {
    const supabase = createClient()
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/reset-password', // change route if you have a dedicated one
      });
      if (error) throw error;
      toast.success('Password reset email sent. Check your inbox.');
      setEmail('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSend} className="space-y-3">
      <div>
        <label className="text-sm">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded"
          required
        />
      </div>
      <div>
        <button disabled={loading} className="px-4 py-2 bg-rose-600 text-white rounded">
          {loading ? 'Sending...' : 'Send reset email'}
        </button>
      </div>
    </form>
  );
}
