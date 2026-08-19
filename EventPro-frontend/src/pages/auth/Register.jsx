import React, { useState } from "react";
import { Calendar, Package, Check, Eye, EyeOff } from "lucide-react";
import PrimaryButton from "../../components/PrimaryButton";
import { auth } from "../../firebase/firebase";
import { Navigate } from "react-router-dom";
import { Title } from "react-head";
import { useAuthRegister } from "../../hooks/useAuth";

export default function Register({ user }) {

    const [error, setError] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pwVisible, setPwVisible] = useState(false);
    const [role, setRole] = useState('');
    const [errorPassword, setErrorPassword] = useState('')
    const [currentStep, setCurrentStep] = useState(1)

    const { register, isLoading, error: registerError } = useAuthRegister()

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(null);
        setErrorPassword('');

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Invalid email format.");
            return;
        }

        if (password.length < 5) {
            return setErrorPassword('Password must be at least 6 characters long.')
        }

        const userData = {
            first_name: firstName,
            last_name: lastName,
            role: role
        }

        await register(auth, email, password, userData)

    }

    const goToNextStep = () => {
        if (!role) {
            setError(true)
            return
        }

        setCurrentStep(2)
    }

    const goToPreviousStep = () => {
        setCurrentStep(1)
        setError(false)
    }

    const roleOptions = [
        {
            name: 'Event Planner',
            description: 'Create and manage events, find suppliers, and coordinate details',
            icon: Calendar
        },
        {
            name: 'Supplier',
            description: 'Provide services or products for events, connect with events planners',
            icon: Package
        }
    ];


    if (user) {
        return <Navigate to="/dashboard" />
    }

    return (
        <>
            <Title>Register</Title>
            {/* Progress Indicator */}
            <div className="flex justify-center mb-10 items-center gap-3 mt-10">
                <span className={`rounded-full ${currentStep === 2 ? 'bg-green-600' : 'bg-blue-600'} text-white w-8 h-8 items-center flex justify-center font-bold transition-colors duration-300`}>
                    {currentStep === 2 ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <span>1</span>
                    )}
                </span>
                <div className={`w-16 h-1 rounded-full transition-colors duration-300 ${currentStep === 2 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                <span className={`rounded-full ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-300'} font-bold text-white w-8 h-8 flex items-center justify-center transition-colors duration-300`}>
                    2
                </span>
            </div>

            <div className="max-w-2xl mx-auto px-4">
                {/* Step Container with Fixed Height */}
                <div className="relative min-h-[600px]">

                    {/* Step 1: Role Selection */}
                    <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentStep === 1
                        ? 'opacity-100 translate-x-0 pointer-events-auto'
                        : 'opacity-0 -translate-x-8 pointer-events-none'
                        }`}>
                        <div className="flex flex-col items-center text-center px-15">
                            <h1 className="font-bold text-3xl mb-3">Create an Account</h1>
                            <p className="text-gray-600 mb-8">
                                Join our platform and start managing events or providing supplies
                            </p>

                            {/* Role Selection Cards */}
                            <div className="w-full max-w-lg space-y-4 mb-6">
                                {roleOptions.map((option, index) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={index}
                                            className={`w-full p-4 border-2 rounded-lg transition-all duration-200 hover:border-blue-500 hover:shadow-md ${role === option.name
                                                ? 'border-blue-600 bg-blue-50'
                                                : error
                                                    ? 'border-red-300'
                                                    : 'border-gray-200 bg-white'
                                                }`}
                                            onClick={() => {
                                                setRole(option.name);
                                                setError(false);
                                            }}
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="bg-gray-100 rounded-full p-2 flex-shrink-0">
                                                    <Icon size={24} className="text-blue-600" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <h3 className="font-semibold text-lg mb-1">{option.name}</h3>
                                                    <p className="text-gray-600 text-sm leading-relaxed">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {error && (
                                <p className="text-red-600 text-sm mb-4">
                                    You must choose a role to proceed
                                </p>
                            )}

                            <PrimaryButton onClick={goToNextStep} >
                                Continue
                            </PrimaryButton>
                        </div>
                    </div>

                    {/* Step 2: Registration Form */}
                    <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentStep === 2
                        ? 'opacity-100 translate-x-0 pointer-events-auto'
                        : 'opacity-0 translate-x-8 pointer-events-none'
                        }`}>
                        <div className="flex flex-col items-center">
                            <div className="text-center mb-8">
                                <h1 className="font-bold text-3xl mb-3">Create an Account</h1>
                                <p className="text-gray-600">
                                    Just a few more details to get you started
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 w-full max-w-lg">
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-6">
                                        {/* Name Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="firstName" className="block font-semibold mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="firstName"
                                                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    placeholder="John"
                                                    required
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="lastName" className="block font-semibold mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    id="lastName"
                                                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                    placeholder="Doe"
                                                    required
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Email Field */}
                                        <div>
                                            <label htmlFor="email" className="block font-semibold mb-2">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                placeholder="email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />

                                            {error && (
                                                <p className="text-red-500 text-sm mt-1">{error}</p>
                                            )}
                                            {registerError && (
                                                <p className="text-red-500 text-sm mt-1">{registerError}</p>
                                            )}
                                        </div>

                                        {/* Password Field with toggle */}
                                        <div className="relative">
                                            <label htmlFor="password" className="block font-semibold mb-2">
                                                Password
                                            </label>
                                            <input
                                                type={pwVisible ? 'text' : 'password'}
                                                id="password"
                                                minLength={6}
                                                className="w-full py-2 px-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                                placeholder="••••••••"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setPwVisible(v => !v)}
                                                aria-pressed={pwVisible}
                                                aria-label={pwVisible ? 'Hide password' : 'Show password'}
                                                className="absolute right-3 top-[42px] inline-flex items-center justify-center p-1"
                                            >
                                                {pwVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>

                                            {errorPassword && (
                                                <p className="text-red-500 text-sm mt-1">{errorPassword}</p>
                                            )}
                                        </div>

                                        {/* Role Display and Change */}
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-gray-600 text-sm">Account type:</span>
                                                    <span className="font-semibold ml-2">{role}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                                                    onClick={goToPreviousStep}
                                                >
                                                    Change
                                                </button>
                                            </div>
                                        </div>

                                        <button className={`transition-divall duration-100 w-full py-2 rounded-md text-white ${isLoading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`} disabled={isLoading}>
                                            {isLoading ? <div className="flex justify-center">
                                                <div className="w-6 h-6 text-center border border-t-2 border-blue-600 rounded-full animate-spin"></div>
                                            </div> : "Create account"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
