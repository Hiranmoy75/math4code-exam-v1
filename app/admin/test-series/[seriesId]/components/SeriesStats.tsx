"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, IndianRupee, Activity } from "lucide-react";
import { useSeriesExams } from "../hooks/useSeriesData";

export default function SeriesStats({
  seriesId,
  price,
  status,
}: {
  seriesId: string;
  price: string;
  status: string;
}) {
  const { data: seriesExams } = useSeriesExams(seriesId);
  const totalExams = seriesExams?.length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Total Exams"
        value={totalExams}
        icon={<FileText className="w-4 h-4 text-indigo-600" />}
      />
      <StatCard
        title="Price"
        value={price}
        icon={<IndianRupee className="w-4 h-4 text-emerald-600" />}
      />
      <StatCard
        title="Status"
        value={status.charAt(0).toUpperCase() + status.slice(1)}
        valueClass={status === "published" ? "text-green-600" : "text-yellow-600"}
        icon={<Activity className={`w-4 h-4 ${status === "published" ? "text-green-600" : "text-yellow-600"}`} />}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  valueClass,
  icon,
}: {
  title: string;
  value: string | number;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass || "text-slate-900 dark:text-white"}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
