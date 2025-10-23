"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

export default function ExamsInSeries({
  seriesId,
  seriesExams,
  availableExams,
  addExamToSeries,
  removeExamFromSeries,
}: {
  seriesId: string
  seriesExams: any[]
  availableExams: any[]
  addExamToSeries: any
  removeExamFromSeries: any
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Exams in Series</CardTitle>
            <CardDescription>
              Manage exams included in this series
            </CardDescription>
          </div>

          {/* Add Exam Buttons */}
          {availableExams.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {availableExams.map((exam: any, i) => (
                <form
                  key={exam.id}
                  action={addExamToSeries.bind(
                    null,
                    seriesId,
                    exam.id,
                    (seriesExams?.length || 0) + i + 1
                  )}
                >
                  <Button size="sm" variant="outline" type="submit">
                    <Plus className="w-4 h-4 mr-2" />
                    Add {exam.title}
                  </Button>
                </form>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      {/* Existing Exams */}
      <CardContent>
        {seriesExams.length > 0 ? (
          <div className="space-y-2">
            {seriesExams.map((se: any, index: number) => (
              <ExamItem
                key={se.id}
                index={index}
                seriesId={seriesId}
                exam={se.exams}
                removeAction={removeExamFromSeries}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No exams added yet
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/* --------------------------------------------------------
   ✅ ExamItem Component with Shadcn AlertDialog
-------------------------------------------------------- */
function ExamItem({
  index,
  seriesId,
  exam,
  removeAction,
}: {
  index: number
  seriesId: string
  exam: any
  removeAction: any
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    await removeAction(seriesId, exam.id)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <p className="font-medium">
          {index + 1}. {exam.title}
        </p>
        <p className="text-sm text-gray-600">
          {exam.duration_minutes} mins • {exam.total_marks} marks
        </p>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove "{exam.title}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This exam will be permanently removed from this series.
              You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
