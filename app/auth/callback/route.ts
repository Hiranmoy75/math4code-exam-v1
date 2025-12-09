
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/student/dashboard";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Successful login
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Production Safeguard: Ensure profile exists before redirecting
                // This replaces the need for unreliable SQL triggers or client-side syncs
                const { data: existingProfile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (!existingProfile) {
                    // Profile missing? Create it immediately on the server.
                    // This is synchronous and ensures the user lands on the dashboard with data.
                    const role = (user.user_metadata?.role as string) || "student";
                    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "Student";

                    const { error: insertError } = await supabase.from("profiles").insert({
                        id: user.id,
                        email: user.email,
                        full_name: fullName,
                        avatar_url: user.user_metadata?.avatar_url,
                        role: role
                    });

                    if (insertError) {
                        console.error("Callback Profile Creation Error:", insertError);
                        // We continue anyway, as the user is authenticated. 
                        // The dashboard might handle the error or retry.
                    } else {
                        // Force a redirect to dashboard for new users
                        // This is safer than relying on 'next' which might be stale
                        return NextResponse.redirect(`${origin}/student/dashboard`);
                    }
                }

                // Existing user: basic role check for redirect
                if (existingProfile?.role === 'admin') {
                    return NextResponse.redirect(`${origin}/admin/dashboard`);
                }
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate user`);
}
