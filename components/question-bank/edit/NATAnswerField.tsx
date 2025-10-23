import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function NATAnswerField({ formData, setFormData }: any) {
  return (
    <div className="grid gap-2 border-t pt-4">
      <Label>Correct Answer (NAT)</Label>
      <Input
        placeholder="Enter numerical answer"
        value={formData.correct_answer}
        onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
      />
    </div>
  )
}
