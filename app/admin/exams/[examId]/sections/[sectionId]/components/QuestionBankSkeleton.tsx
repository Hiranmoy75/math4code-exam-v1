export default function QuestionBankSkeleton() {
  const rows = Array.from({ length: 4 })
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl max-h-96 overflow-y-auto space-y-3 p-4 bg-white rounded">
        {rows.map((_, idx) => (
          <div key={idx} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}
