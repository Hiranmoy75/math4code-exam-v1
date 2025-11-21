"use server";

import { Suspense } from "react";
import TestSeriesHeader from "./components/TestSeriesHeader";
import TestSeriesList from "./components/TestSeriesList";
import TestSeriesSkeleton from "./components/TestSeriesSkeleton";
import SeriesListWrapper from "./components/SeriesListWrapper";
import { createClient } from "@/lib/supabase/server";

export default async function TestSeriesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Server‑side fetch of stats
    const { data: series, error } = await supabase
        .from("test_series")
        .select("status")
        .eq("admin_id", user?.id);

    const total = series?.length ?? 0;
    const published = series?.filter((s: any) => s.status === "published").length ?? 0;
    const draft = series?.filter((s: any) => s.status === "draft").length ?? 0;

    return (
        <div className="space-y-8 p-2 md:p-1">
            <TestSeriesHeader
                stats={{ total, published, draft }}
                loading={false}
                error={error ? (error as any).message : null}
            />

            <SeriesListWrapper>
                <Suspense fallback={<TestSeriesSkeleton count={3} />}>
                    <TestSeriesList />
                </Suspense>
            </SeriesListWrapper>
        </div>
    );
}
