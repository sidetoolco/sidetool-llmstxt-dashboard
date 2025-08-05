'use client'

export const FileCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded-lg flex-1 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded-lg flex-1 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Search/Filter Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Files Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <FileCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}