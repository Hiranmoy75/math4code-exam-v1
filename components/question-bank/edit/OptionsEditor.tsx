"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface Option {
  option_text: string
  option_order: number
  is_correct: boolean
}

export function OptionsEditor({
  options,
  setOptions,
}: {
  options: Option[]
  setOptions: React.Dispatch<React.SetStateAction<Option[]>>
}) {
  const handleChange = (index: number, field: string, value: string | boolean) => {
    const updated = [...options]
    if (field === "option_text") updated[index].option_text = value as string
    if (field === "is_correct") updated.forEach((opt, i) => (opt.is_correct = i === index))
    setOptions(updated)
  }

  const addOption = () => {
    setOptions([...options, { option_text: "", option_order: options.length + 1, is_correct: false }])
  }

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index)
    setOptions(updated.map((opt, i) => ({ ...opt, option_order: i + 1 })))
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex justify-between items-center">
        <Label>Options</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="w-4 h-4 mr-1" /> Add Option
        </Button>
      </div>

      {options.map((option, i) => (
        <div key={i} className="flex gap-2 items-end">
          <Input
            placeholder={`Option ${i + 1}`}
            value={option.option_text}
            onChange={(e) => handleChange(i, "option_text", e.target.value)}
          />
          <input
            type="radio"
            checked={option.is_correct}
            onChange={() => handleChange(i, "is_correct", true)}
          />
          <Label className="text-sm">Correct</Label>
          {options.length > 1 && (
            <Button variant="destructive" size="sm" onClick={() => removeOption(i)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
