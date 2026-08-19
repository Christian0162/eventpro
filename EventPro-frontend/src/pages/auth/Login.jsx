import { Link } from "react-router-dom";
import { useState } from "react";
import { auth } from "../../firebase/firebase";
import { Navigate } from "react-router-dom";
import { useAuthLogin } from "../../hooks/useAuth";
import { Title } from "react-head";
import LoadingOverlay from "../../components/LoadingOverlay";
import { Eye, EyeOff } from "lucide-react";

export default function Login({ user }) {
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pwVisible, setPwVisible] = useState(false);

    const { login, error: errorLogin, isLoading: isLoginLoading } = useAuthLogin()

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await login(auth, email, password)
        }
        catch (error) {
            console.log(error.code)
        }

        setIsLoading(false);
    }

    if (user) {
        return <Navigate to={'/dashboard'} />;
    }

    return (
        <>
            <Title>Login</Title>

            {isLoginLoading && (
                <LoadingOverlay isLoading={isLoginLoading} message="Processing.." />
            )}

            <div className="flex w-full h-full justify-center items-center mt-10">
                <form onSubmit={handleSubmit}>
                    <div className="p-13 w-[30rem] shadow-2xl border border-gray-200 rounded-lg">
                        <div className="space-y-2 flex flex-col justify-center items-center">
                            <span className="text-3xl font-bold ">Welcome</span>
                            <div>
                                <span className="text-gray-600"> Enter your credentials to access your account</span>
                            </div>
                        </div>
                        {/* email */}
                        <div className="flex flex-col mt-10 mb-5">
                            <label htmlFor="email" className="font-bold mb-3">Email</label>
                            <input type="email" name="email" id="email" className="py-2 border border-gray-500 rounded-md px-3 focus:ring-blue-600 focus:ring-1 focus:outline-none" placeholder="email@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <span className={`mt-1 ml-1 ${errorLogin ? 'block text-red-500' : 'hidden'}`}>{errorLogin}</span>
                        </div>

                        {/* password */}
                        <div className="flex flex-col mt-3 relative">
                            <label htmlFor="password" className="font-bold mb-3">Password</label>

                            <input
                                type={pwVisible ? 'text' : 'password'}
                                name="password"
                                id="password"
                                className="py-2 border border-gray-500 rounded-md px-3 pr-10 focus:ring-blue-600 focus:ring-1 focus:outline-none"
                                placeholder="******"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            {/* show/hide button */}
                            <button
                                type="button"
                                onClick={() => setPwVisible(v => !v)}
                                aria-pressed={pwVisible}
                                aria-label={pwVisible ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-[42px] inline-flex items-center justify-center p-1"
                            >
                                {pwVisible ? <EyeOff size={22} /> : <Eye size={22} />}
                            </button>

                            <span className={`mt-1 ml-1 ${errorLogin ? 'block text-red-500' : 'hidden'}`}>{errorLogin}</span>

                            {/* Forgot password link */}
                            <div className="mt-2 text-right">
                                <Link to="/forgot-password" className="text-blue-500 hover:text-blue-700 text-sm">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button className={`w-full py-2 rounded-md text-white text-md mt-4 ${isLoginLoading ? 'bg-blue-300' : 'bg-blue-600'}`} disabled={isLoginLoading}>{isLoginLoading ? 'Logging in..' : 'Login'}</button>

                        <div className="text-center mt-8">
                            <span>Don't have an account? <Link to={'/register'} className="text-blue-500 hover:text-blue-700">Register</Link></span>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
