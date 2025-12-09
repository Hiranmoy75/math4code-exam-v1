import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteBunnyVideo } from '@/lib/bunny';

/**
 * API Route: Delete Video from Bunny.net
 * POST /api/bunny/delete
 * 
 * Body: { videoId: string }
 * Returns: { success: boolean }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        // Parse request body
        const { videoId } = await request.json();

        if (!videoId) {
            return NextResponse.json(
                { error: 'Missing videoId' },
                { status: 400 }
            );
        }

        // Get Bunny.net settings
        const { data: settings, error: settingsError } = await supabase
            .from('bunny_settings')
            .select('bunny_api_key, bunny_library_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'Bunny.net settings not configured' },
                { status: 500 }
            );
        }

        // Delete video from Bunny.net
        const deleted = await deleteBunnyVideo(
            settings.bunny_library_id,
            videoId,
            settings.bunny_api_key
        );

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete video from Bunny.net' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Video deleted successfully'
        });

    } catch (error) {
        console.error('Bunny delete API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
