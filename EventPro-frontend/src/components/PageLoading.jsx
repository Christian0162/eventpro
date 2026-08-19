export default function PageLoading() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="relative">
                <div className="absolute inset-0 h-12 w-12 bg-blue-500/10 rounded-full blur-sm animate-pulse"></div>
                <div className="h-12 w-12 border-2 border-blue-100 rounded-full animate-spin border-t-blue-600 border-r-blue-600"></div>
            </div>
        </div>
    )
}