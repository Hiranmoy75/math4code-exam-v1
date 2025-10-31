// components/AvatarUpload.tsx
'use client';
import React, { useState } from 'react';
import { createClient } from "@/lib/supabase/client"
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

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
    // uploadAvatar must return a string (public URL)
    const publicUrl = await uploadAvatar(file);
    return publicUrl;
  },

  onSuccess: async (publicUrl) => {
    // ✅ Supabase v2 getUser() returns { data: { user }, error }
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

    // ✅ Update avatar URL in profiles
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

    // ✅ React Query v5 syntax
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

  // ✅ Correct syntax for useMutation (v5)
  mutation.mutate(f, {
    onSettled: () => {
      setLoading(false);
      e.target.value = ""; // reset input for next upload
    },
  });
};


  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 rounded-full overflow-hidden border">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
            <span>NO</span>
          </div>
        )}
      </div>

      <div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md shadow-sm text-sm">
          <input onChange={onFile} type="file" accept="image/*" className="hidden" />
          {loading ? 'Uploading...' : 'Upload Avatar'}
        </label>
      </div>
    </div>
  );
}
