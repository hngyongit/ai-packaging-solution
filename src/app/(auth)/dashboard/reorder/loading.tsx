export default function ReorderLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-8 w-36 rounded bg-gray-200" />
        <div className="h-4 w-96 max-w-full rounded bg-gray-200" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="h-80 rounded-lg border bg-gray-100" />
        <div className="h-80 rounded-lg border bg-gray-100" />
      </div>
    </div>
  )
}
