import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateCollection } from '@/lib/bunny';

/**
 * API Route: Get or Create Bunny.net Collection for a Course
 * POST /api/admin/bunny-collections
 * 
 * Body: { courseId: string, courseTitle: string }
 * Returns: { collectionId: string, created: boolean }
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
        const { courseId, courseTitle } = await request.json();

        if (!courseId || !courseTitle) {
            return NextResponse.json(
                { error: 'Missing courseId or courseTitle' },
                { status: 400 }
            );
        }

        // Check if course already has a collection ID
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('bunny_collection_id')
            .eq('id', courseId)
            .single();

        if (courseError) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            );
        }

        // If collection ID already exists, return it
        if (course.bunny_collection_id) {
            return NextResponse.json({
                collectionId: course.bunny_collection_id,
                created: false,
                cached: true
            });
        }

        // Get Bunny.net settings
        const { data: settings, error: settingsError } = await supabase
            .from('bunny_settings')
            .select('bunny_api_key, bunny_library_id')
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'Bunny.net settings not configured' },
                { status: 500 }
            );
        }

        // Get or create collection in Bunny.net
        const { collectionId, created } = await getOrCreateCollection(
            settings.bunny_library_id,
            settings.bunny_api_key,
            courseTitle
        );

        // Update course with collection ID
        const { error: updateError } = await supabase
            .from('courses')
            .update({ bunny_collection_id: collectionId })
            .eq('id', courseId);

        if (updateError) {
            console.error('Failed to update course with collection ID:', updateError);
            // Don't fail the request, collection was created successfully
        }

        return NextResponse.json({
            collectionId,
            created,
            cached: false
        });

    } catch (error) {
        console.error('Bunny collections API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
