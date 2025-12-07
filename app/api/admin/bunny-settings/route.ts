import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBunnyCredentials } from '@/lib/bunny';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Fetch Bunny.net settings (with masked API key)
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            );
        }

        // Fetch settings
        const { data: settings, error } = await supabase
            .from('bunny_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (!settings) {
            return NextResponse.json(
                { hasSettings: false },
                { headers: corsHeaders }
            );
        }

        // Mask API key for security (show only last 4 characters)
        const maskedApiKey = settings.bunny_api_key
            ? `${'*'.repeat(settings.bunny_api_key.length - 4)}${settings.bunny_api_key.slice(-4)}`
            : '';

        return NextResponse.json(
            {
                hasSettings: true,
                bunny_library_id: settings.bunny_library_id,
                bunny_stream_library_id: settings.bunny_stream_library_id,
                bunny_api_key: maskedApiKey,
                is_active: settings.is_active,
                created_at: settings.created_at
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('Get Bunny Settings Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// POST - Save/Update Bunny.net settings
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

        const body = await req.json();
        const { bunny_api_key, bunny_library_id, bunny_stream_library_id } = body;

        // Validate required fields
        if (!bunny_api_key || !bunny_library_id) {
            return NextResponse.json(
                { error: 'API Key and Library ID are required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Validate credentials with Bunny.net
        const isValid = await validateBunnyCredentials(bunny_library_id, bunny_api_key);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid Bunny.net credentials. Please check your API Key and Library ID.' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Check if settings already exist
        const { data: existing } = await supabase
            .from('bunny_settings')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (existing) {
            // Update existing settings
            const { error: updateError } = await supabase
                .from('bunny_settings')
                .update({
                    bunny_api_key,
                    bunny_library_id,
                    bunny_stream_library_id: bunny_stream_library_id || bunny_library_id,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;
        } else {
            // Insert new settings
            const { error: insertError } = await supabase
                .from('bunny_settings')
                .insert({
                    user_id: user.id,
                    bunny_api_key,
                    bunny_library_id,
                    bunny_stream_library_id: bunny_stream_library_id || bunny_library_id,
                    is_active: true
                });

            if (insertError) throw insertError;
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Bunny.net settings saved successfully'
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('Save Bunny Settings Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save settings' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// DELETE - Remove Bunny.net settings
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            );
        }

        const { error } = await supabase
            .from('bunny_settings')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json(
            { success: true, message: 'Settings deleted successfully' },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('Delete Bunny Settings Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete settings' },
            { status: 500, headers: corsHeaders }
        );
    }
}
