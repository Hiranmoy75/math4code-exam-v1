import { createClient } from "@/lib/supabase/server";
import { RewardInitializer } from "@/components/RewardInitializer";

export async function RewardInitializerWrapper() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return <RewardInitializer userId={user.id} />;
}
