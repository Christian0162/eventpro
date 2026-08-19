export default function LoadingOverlay({ isLoading, message = "Processing..." }) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex flex-col items-center justify-center">
            <div className="bg-white p-10 rounded-2xl flex flex-col items-center gap-4 shadow-lg">
                <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700 font-medium">{message}</p>
            </div>
        </div>
    );
}