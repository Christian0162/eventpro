import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"
import { AlignJustify } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { Link } from "react-router-dom";

export default function DropDown({ user }) {

    const handleSignOut = async () => {
        await signOut(auth)
    }

    return (
        <div className="block sm:hidden">
            <Menu as="div" className="relative inline-block text-left">
                <MenuButton className="inline-flex items-center">
                    <div className="transition-all text-black hover:text-gray-500 duration-75">
                        <AlignJustify size={24} strokeWidth={2} color="currentColor" />
                    </div>
                </MenuButton>

                <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right text-sm border border-gray-200 bg-white focus:outline-none shadow-lg rounded-md z-[9999] max-h-96 overflow-y-auto">
                    <div className="py-1">
                        {!user && (
                            <>
                                <MenuItem>
                                    {({ active }) => (
                                        <Link 
                                            to={'/login'} 
                                            className={`block px-4 py-2 text-left transition-colors duration-75 ${
                                                active ? 'bg-gray-100' : ''
                                            }`}
                                        >
                                            Login
                                        </Link>
                                    )}
                                </MenuItem>

                                <MenuItem>
                                    {({ active }) => (
                                        <Link 
                                            to={'/register'} 
                                            className={`block px-4 py-2 text-left transition-colors duration-75 ${
                                                active ? 'bg-gray-100' : ''
                                            }`}
                                        >
                                            Register
                                        </Link>
                                    )}
                                </MenuItem>
                            </>
                        )}

                        {user && (
                            <>
                                <MenuItem>
                                    {({ active }) => (
                                        <Link 
                                            to={'/dashboard'} 
                                            className={`block px-4 py-2 text-left transition-colors duration-75 ${
                                                active ? 'bg-gray-100' : ''
                                            }`}
                                        >
                                            Dashboard
                                        </Link>
                                    )}
                                </MenuItem>

                                <MenuItem>
                                    {({ active }) => (
                                        <Link 
                                            to={'/suppliers'} 
                                            className={`block px-4 py-2 text-left transition-colors duration-75 ${
                                                active ? 'bg-gray-100' : ''
                                            }`}
                                        >
                                            Supplier
                                        </Link>
                                    )}
                                </MenuItem>

                                <MenuItem>
                                    {({ active }) => (
                                        <Link 
                                            to={'/events'} 
                                            className={`block px-4 py-2 text-left transition-colors duration-75 ${
                                                active ? 'bg-gray-100' : ''
                                            }`}
                                        >
                                            Events
                                        </Link>
                                    )}
                                </MenuItem>

                                <MenuItem>
                                    {({ active }) => (
                                        <Link 
                                            to={'/profile'} 
                                            className={`block px-4 py-2 text-left transition-colors duration-75 ${
                                                active ? 'bg-gray-100' : ''
                                            }`}
                                        >
                                            Profile
                                        </Link>
                                    )}
                                </MenuItem>

                                <MenuItem>
                                    {({ active }) => (
                                        <Link 
                                            to={'/settings'} 
                                            className={`block px-4 py-2 text-left transition-colors duration-75 ${
                                                active ? 'bg-gray-100' : ''
                                            }`}
                                        >
                                            Settings
                                        </Link>
                                    )}
                                </MenuItem>

                                <MenuItem>
                                    {({ active }) => (
                                        <button 
                                            onClick={() => handleSignOut()} 
                                            className={`block px-4 py-2 w-full text-left transition-colors duration-75 text-red-600 ${
                                                active ? 'bg-red-50' : ''
                                            }`}
                                        >
                                            Sign out
                                        </button>
                                    )}
                                </MenuItem>
                            </>
                        )}
                    </div>
                </MenuItems>
            </Menu>
        </div>
    );
}