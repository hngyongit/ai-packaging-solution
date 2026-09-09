export default function OrderDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-4 w-56 rounded bg-gray-200" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="h-72 rounded-lg border bg-gray-100" />
          <div className="h-64 rounded-lg border bg-gray-100" />
        </div>
        <div className="space-y-6">
          <div className="h-56 rounded-lg border bg-gray-100" />
          <div className="h-48 rounded-lg border bg-gray-100" />
        </div>
      </div>
    </div>
  )
}
