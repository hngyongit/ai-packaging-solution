export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-200" />
      </div>
      <div className="h-9 w-full max-w-sm rounded-lg bg-gray-200" />
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-lg border p-5">
          <div className="h-5 w-44 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 rounded bg-gray-200" />
          <div className="mt-5 h-2 rounded-full bg-gray-200" />
          <div className="mt-5 h-8 w-32 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}
