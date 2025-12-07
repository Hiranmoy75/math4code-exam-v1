// components/ForgotPassword.tsx
'use client';
import React, { useState } from 'react';
import { createClient } from "@/lib/supabase/client"
import toast from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, RefreshCw } from "lucide-react";

export default function ForgotPassword() {
  const supabase = createClient()
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // This will send a password reset email to the user (if provider logic supports it)
  const onReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // redirectTo should point to a page that handles the recovery token
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent (check spam too!)');
      setEmail('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onReset} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>
      <div className="pt-2">
        <Button disabled={loading} type="submit" variant="outline" className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Send Reset Link
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
