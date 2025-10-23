export default function QuestionExplanation({ explanation }: { explanation: string }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">Explanation</h3>
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
      </div>
    </div>
  )
}
