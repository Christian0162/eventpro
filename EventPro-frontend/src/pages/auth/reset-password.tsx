import { useSearchParams, useNavigate } from "react-router-dom";
import { getAuth, confirmPasswordReset } from "firebase/auth";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    useEffect(() => {
        if (mode !== "resetPassword" || !oobCode) {
            Swal.fire({
                icon: "error",
                title: "Invalid link",
                text: "The password reset link is invalid or expired.",
            });
            navigate("/login");
        }
    }, [mode, oobCode, navigate]);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const auth = getAuth();
            await confirmPasswordReset(auth, oobCode, newPassword);

            Swal.fire({
                icon: "success",
                title: "Password Reset",
                text: "Your password has been successfully reset!",
                confirmButtonText: "Login",
            }).then(() => {
                navigate("/login");
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message,
            });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-10">
                <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
                <form onSubmit={handleReset} className="space-y-4">
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
