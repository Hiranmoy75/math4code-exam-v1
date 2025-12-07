// components/AvatarUpload.tsx
'use client';
import React, { useState } from 'react';
import { createClient } from "@/lib/supabase/client"
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Upload } from "lucide-react";

async function uploadAvatar(file: File) {
  const supabase = createClient()
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!userData.user) throw new Error('Not signed in');

  const userId = userData.user.id;
  const ext = file.name.split('.').pop();
  const filePath = `avatars/${userId}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadErr) throw uploadErr;

  // create public URL
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

export default function AvatarUpload({ currentUrl }: { currentUrl?: string | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const publicUrl = await uploadAvatar(file);
      return publicUrl;
    },

    onSuccess: async (publicUrl) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        toast.error(userErr.message);
        return;
      }

      const user = userData?.user;
      if (!user) {
        toast.error("User not found");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Avatar updated successfully!");
    },

    onError: (err: any) => {
      toast.error(err?.message || "Upload failed");
    },
  });


  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);

    mutation.mutate(f, {
      onSettled: () => {
        setLoading(false);
        e.target.value = "";
      },
    });
  };


  return (
    <div className="flex flex-col items-center gap-4 group cursor-pointer relative">
      <div className="relative">
        <Avatar className="w-24 h-24 border-4 border-white dark:border-slate-800 shadow-xl">
          <AvatarImage src={currentUrl || ""} className="object-cover" />
          <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            {/* Logic for initial could be added if name was passed, but relying on fallback string logic in Avatar component or parent usually */}
            U
          </AvatarFallback>
        </Avatar>

        <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg cursor-pointer transition-colors">
          <input onChange={onFile} type="file" accept="image/*" className="hidden" disabled={loading} />
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </label>
      </div>
      <p className="text-xs text-muted-foreground font-medium">Click camera icon to change</p>
    </div>
  );
}
