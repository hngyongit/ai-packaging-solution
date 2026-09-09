export default function HistoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-44 rounded bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-200" />
      </div>
      <div className="h-9 w-full max-w-sm rounded-lg bg-gray-200" />
      {[1, 2].map((item) => (
        <div key={item} className="h-48 rounded-lg border bg-gray-100" />
      ))}
    </div>
  )
}
