"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useSeriesMutations } from "../hooks/useSeriesData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function PublishButton({
  seriesId,
  isPublished,
}: {
  seriesId: string;
  isPublished: boolean;
}) {
  const { publishSeries } = useSeriesMutations(seriesId);
  const [isOpen, setIsOpen] = useState(false);

  const handlePublish = () => {
    publishSeries.mutate(undefined, {
      onSuccess: () => setIsOpen(false),
    });
  };

  if (isPublished) {
    return (
      <Button variant="secondary" disabled className="bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Published
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
          <Upload className="w-4 h-4 mr-2" />
          Publish Series
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Test Series?</AlertDialogTitle>
          <AlertDialogDescription>
            This will make the test series visible to all students. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePublish}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={publishSeries.isPending}
          >
            {publishSeries.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Publish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
