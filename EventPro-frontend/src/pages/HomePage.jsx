import { Navigate } from "react-router-dom";
import { Calendar, Heart, Users, Star, ChevronRight } from 'lucide-react';
import { Link } from "react-router-dom";


export default function HomePage({ user }) {

    if (user) {
        return <Navigate to={'/dashboard'} />
    }

    return (
        <>
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-20 h-20 bg-pink-300 rounded-full blur-xl"></div>
                    <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300 rounded-full blur-xl"></div>
                    <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-purple-300 rounded-full blur-xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                                    <span className="text-gray-800">Connect & Create</span>
                                    <br />
                                    <span className="text-gray-800">Memorable Events</span>
                                    <br />
                                    <span className="text-gray-600">with </span>
                                    <span className="text-blue-600 relative">
                                        Event
                                        <span className="text-blue-700 font-black">Pro</span>
                                        <div className="absolute -bottom-2 left-0 w-full h-3 bg-blue-200 opacity-30 rounded"></div>
                                    </span>
                                </h1>

                                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                                    Transform your special moments into unforgettable experiences with our comprehensive event planning platform.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to={'/login'}
                                    className="group px-8 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                >
                                    <span className="flex items-center justify-center">
                                        Login
                                        <ChevronRight className={`ml-2 w-5 h-5 transition-transform duration-300 hover:translate-x-1`} />
                                    </span>
                                </Link>

                                <Link to={'/register'} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    Register
                                </Link>
                            </div>

                            {/* Features Preview */}
                            <div className="grid grid-cols-3 gap-6 pt-8">
                                <div className="text-center group">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Smart Planning</p>
                                </div>
                                <div className="text-center group">
                                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-pink-200 transition-colors">
                                        <Users className="w-6 h-6 text-pink-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Team Collaboration</p>
                                </div>
                                <div className="text-center group">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                                        <Star className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Premium Experience</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Hero Image */}
                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                                {/* Laptop mockup */}
                                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 aspect-[4/3]">
                                    <div className="bg-white rounded-lg shadow-lg h-full relative overflow-hidden">
                                        {/* Calendar interface mockup */}
                                        <div className="p-6 h-full">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold text-gray-800">Wedding Calendar</h3>
                                                <div className="flex space-x-2">
                                                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                                </div>
                                            </div>

                                            {/* Calendar grid */}
                                            <div className="grid grid-cols-7 gap-2 mb-4">
                                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                    <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                                                        {day}
                                                    </div>
                                                ))}
                                                {Array.from({ length: 35 }, (_, i) => (
                                                    <div key={i} className={`text-center text-xs py-2 rounded ${i === 15 ? 'bg-pink-500 text-white' :
                                                        i === 22 ? 'bg-blue-500 text-white' :
                                                            'text-gray-400 hover:bg-gray-100'
                                                        }`}>
                                                        {i < 30 ? i + 1 : ''}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Event items */}
                                            <div className="space-y-2">
                                                <div className="flex items-center p-2 bg-pink-50 rounded border-l-4 border-pink-500">
                                                    <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                                                    <span className="text-sm text-gray-700">Venue Booking</span>
                                                </div>
                                                <div className="flex items-center p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                                    <span className="text-sm text-gray-700">Catering Meeting</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Wedding planning items scattered around */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-300">
                                <Heart className="w-8 h-8 text-pink-500" />
                            </div>

                            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>

                            {/* Floating elements */}
                            <div className="absolute top-1/4 -left-8 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
                            <div className="absolute bottom-1/3 -right-6 w-6 h-6 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                            <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-700"></div>
                        </div>
                    </div>
                </div>

                {/* Bottom wave */}
                <div className="absolute bottom-0 left-0 w-full">
                    <svg viewBox="0 0 1200 120" fill="none" className="w-full h-20">
                        <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="white" fillOpacity="0.1" />
                    </svg>
                </div>
            </div>
        </>
    );
}