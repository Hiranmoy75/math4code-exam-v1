import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function QuestionMetadataFields({ formData, setFormData }: any) {
  return (
    <div className="grid grid-cols-2 gap-4 border-t pt-4">
      <div className="grid gap-2">
        <Label>Marks</Label>
        <Input
          type="number"
          value={formData.marks}
          onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Negative Marks</Label>
        <Input
          type="number"
          step="0.25"
          value={formData.negative_marks}
          onChange={(e) => setFormData({ ...formData, negative_marks: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Difficulty</Label>
        <select
          className="border rounded px-3 py-2"
          value={formData.difficulty}
          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Subject</Label>
        <Input
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Topic</Label>
        <Input
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
        />
      </div>
    </div>
  )
}
