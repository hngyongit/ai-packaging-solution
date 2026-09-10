export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-4 w-32 rounded bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-28 rounded-lg bg-gray-200" />
        <div className="h-28 rounded-lg bg-gray-200" />
        <div className="h-28 rounded-lg bg-gray-200" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-32 rounded-md bg-gray-200" />
        <div className="h-10 w-28 rounded-md bg-gray-200" />
        <div className="h-10 w-32 rounded-md bg-gray-200" />
      </div>

      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="h-11 bg-gray-100" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 border-t border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  )
}
