export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-40" />
        <div className="h-9 bg-gray-200 rounded w-32" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <div className="h-9 bg-gray-200 rounded w-36" />
        <div className="h-9 bg-gray-200 rounded w-36" />
        <div className="h-9 bg-gray-200 rounded w-36" />
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48" />
              <div className="h-3 bg-gray-200 rounded w-64" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
