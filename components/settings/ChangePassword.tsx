// components/ChangePassword.tsx
'use client';
import React, { useState } from 'react';
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";

export default function ChangePassword() {
  const supabase = createClient()
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd || newPwd !== confirmPwd) {
      toast.error('New password and confirm password must match');
      return;
    }
    setLoading(true);

    try {
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
    <form onSubmit={onChange} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="pl-9"
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="pl-9"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      <div className="pt-2">
        <Button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </div>
    </form>
  );
}
