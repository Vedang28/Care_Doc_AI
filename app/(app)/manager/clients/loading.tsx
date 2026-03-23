export default function ClientsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-36" />
        <div className="h-9 bg-gray-200 rounded w-28" />
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3">
        <div className="h-9 bg-gray-200 rounded flex-1 max-w-xs" />
        <div className="h-9 bg-gray-200 rounded w-32" />
      </div>

      {/* Client cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
