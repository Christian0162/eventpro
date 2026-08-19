// components/Footer.jsx
import { Link } from "react-router-dom"
import { Facebook, Twitter, Instagram, Mail } from "lucide-react"

export default function Footer() {
    return (
        <footer className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white mt-15">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">

                    {/* Brand / About */}
                    <div>
                        <h3 className="text-2xl font-bold">EventPro</h3>
                        <p className="mt-3 text-sm text-gray-200 leading-relaxed">
                            Simplifying event planning by connecting you with trusted suppliers
                            and tools to manage everything in one place.
                        </p>
                    </div>

                    {/* Navigation Links */}
                    <div>
                        <h3 className="text-lg font-semibold uppercase tracking-wide">Quick Links</h3>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-yellow-300 transition-colors">Home</Link></li>
                            <li><Link to="/events" className="hover:text-yellow-300 transition-colors">Events</Link></li>
                            <li><Link to="/suppliers" className="hover:text-yellow-300 transition-colors">Suppliers</Link></li>
                            <li><Link to="/contact" className="hover:text-yellow-300 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Social / Contact */}
                    <div>
                        <h3 className="text-lg font-semibold uppercase tracking-wide">Connect</h3>
                        <p className="mt-3 text-sm text-gray-200">Follow us on social media</p>
                        <div className="flex justify-center md:justify-start space-x-5 mt-4">
                            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-yellow-300 hover:text-black transition">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-yellow-300 hover:text-black transition">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-yellow-300 hover:text-black transition">
                                <Instagram size={20} />
                            </a>
                            <a href="mailto:support@eventpro.com" className="p-2 rounded-full bg-white/10 hover:bg-yellow-300 hover:text-black transition">
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 border-t border-white/20 pt-5 text-center text-sm text-gray-200">
                    © {new Date().getFullYear()} <span className="font-semibold">EventPro</span>. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
