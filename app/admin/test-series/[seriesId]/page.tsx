import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import SeriesStats from "./components/SeriesStats";
import ExamsInSeries from "./components/ExamsInSeries";
import PublishButton from "./components/PublishButton";

export default async function TestSeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = await params;

  if (seriesId === "create") {
    redirect("/admin/test-series/create");
  }

  const supabase = await createClient();

  const { data: series, error: seriesError } = await supabase
    .from("test_series")
    .select("*")
    .eq("id", seriesId)
    .single();

  if (seriesError || !series) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Series Not Found</CardTitle>
            <CardDescription className="text-red-700">
              The test series you're looking for doesn't exist or hasn't been created yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/test-series">
              <Button variant="outline" className="bg-white hover:bg-red-50 border-red-200 text-red-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/admin/test-series" className="hover:text-indigo-600 transition-colors">
              Test Series
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">
              {series.title}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {series.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            {series.description}
          </p>
        </div>

        <PublishButton
          seriesId={seriesId}
          isPublished={series.status === "published"}
        />
      </div>

      <SeriesStats
        seriesId={seriesId}
        price={series.is_free ? "Free" : `₹${series.price}`}
        status={series.status}
      />

      <ExamsInSeries seriesId={seriesId} />
    </div>
  );
}
