"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    maxSizeMB?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    maxSizeMB = 0.3, // Default 300KB
    maxWidth = 600,
    maxHeight = 400
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Validate File Size
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`File size must be less than ${maxSizeMB * 1000}KB`);
            return;
        }

        // 2. Validate Dimensions
        const img = new window.Image();
        img.src = URL.createObjectURL(file);

        img.onload = async () => {
            URL.revokeObjectURL(img.src);

            // Allow some tolerance or strict check? User said "should be 600x400".
            // Let's warn but maybe allow if it's close? Or strictly enforce?
            // "Note: cover size should be 600x400" sounds like a requirement.
            // But usually exact pixel match is annoying. Let's check aspect ratio or max dimensions.
            // Re-reading: "cover size should be 600x400". I will enforce it strictly for now as requested.

            if (img.width !== maxWidth || img.height !== maxHeight) {
                toast.error(`Image dimensions must be exactly ${maxWidth}x${maxHeight}px`);
                return;
            }

            // 3. Upload to Supabase
            try {
                setIsUploading(true);

                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `course-thumbnails/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('courses') // Assuming 'courses' bucket exists
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('courses')
                    .getPublicUrl(filePath);

                onChange(publicUrl);
                toast.success("Thumbnail uploaded successfully");
            } catch (error) {
                console.error("Upload error:", error);

                // Debug: Check available buckets
                const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
                console.log("Available buckets:", buckets);
                if (bucketError) console.error("Error listing buckets:", bucketError);

                toast.error("Failed to upload image: " + (error as any).message);
            } finally {
                setIsUploading(false);
            }
        };

        img.onerror = () => {
            toast.error("Invalid image file");
            URL.revokeObjectURL(img.src);
        };
    };

    const handleRemove = () => {
        onChange("");
    };

    return (
        <div className="space-y-4 w-full flex flex-col justify-center items-center">
            <div className="relative w-full h-[200px] md:w-[300px] md:h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {value ? (
                    <>
                        <div className="relative w-full h-full">
                            <Image
                                fill
                                src={value}
                                alt="Upload"
                                className="object-cover"
                            />
                        </div>
                        <button
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                            type="button"
                            disabled={disabled}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
                        <ImagePlus className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm font-medium">Click to upload thumbnail</p>
                        <p className="text-xs text-slate-400 mt-1">
                            {maxWidth}x{maxHeight}px, max {maxSizeMB * 1000}KB
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    onChange={handleFileSelect}
                    disabled={disabled || isUploading}
                />

                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}
