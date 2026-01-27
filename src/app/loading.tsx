export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Laden...</p>
      </div>
    </div>
  )
}
