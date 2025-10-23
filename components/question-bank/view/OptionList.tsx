interface Option {
  id: string
  option_text: string
  option_order: number
  is_correct: boolean
}

export default function OptionList({ options }: { options: Option[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Options</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <div
            key={option.id}
            className={`p-3 rounded border ${
              option.is_correct ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-sm font-semibold text-gray-600 min-w-fit">
                {String.fromCharCode(64 + option.option_order)}.
              </div>
              <div className="flex-1">
                <p className="text-gray-700">{option.option_text}</p>
                {option.is_correct && (
                  <p className="text-xs text-green-700 font-semibold mt-1">✓ Correct Answer</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
