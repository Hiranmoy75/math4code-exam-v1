import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateUploadSignature, createBunnyVideo } from '@/lib/bunny';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}
/**
 * Generate upload signature for Bunny.net direct upload
 * This allows the browser to upload directly to Bunny.net using TUS protocol
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            );
        }

        // Get request body
        const body = await req.json();
        const { videoTitle, collectionId } = body;

        if (!videoTitle) {
            return NextResponse.json(
                { error: 'Video title is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Fetch user's Bunny.net credentials
        const { data: settings, error: settingsError } = await supabase
            .from('bunny_settings')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'Bunny.net settings not found. Please configure your Bunny.net credentials first.' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Create a video object in Bunny.net first (with optional collection)
        const { videoId, guid } = await createBunnyVideo(
            settings.bunny_library_id,
            settings.bunny_api_key,
            videoTitle,
            collectionId // Pass collection ID if provided
        );

        // Return all necessary data for client-side upload
        return NextResponse.json(
            {
                success: true,
                videoId,
                guid,
                libraryId: settings.bunny_library_id,
                apiKey: settings.bunny_api_key // For direct upload
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('Generate Upload Signature Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate upload signature' },
            { status: 500, headers: corsHeaders }
        );
    }
}
