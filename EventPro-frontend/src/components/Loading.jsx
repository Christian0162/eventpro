import { SyncLoader } from "react-spinners";

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/40">
            <div className="text-center space-y-8">
                {/* Enhanced spinner with container */}
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-md animate-pulse"></div>
                    <SyncLoader
                        size={18}
                        color="#2563eb"
                        speedMultiplier={0.75}
                    />
                </div>

                {/* Text with subtle animation */}
                <div className="space-y-2">
                    <p className="text-gray-700 font-medium text-sm uppercase tracking-wider">
                        Loading Content
                    </p>
                    <p className="text-gray-400 text-xs animate-pulse">
                        Please wait a moment...
                    </p>
                </div>
            </div>
        </div>
    );
}