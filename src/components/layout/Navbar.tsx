import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { Button } from "../ui/Button"
import { useAuth } from "../../context/AuthContext"
import { useState } from "react"

export function Navbar() {
    const { user, userProfile, logout } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

    return (
        <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-t-4 border-orange-500">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                <Link to="/" className="flex items-center gap-2">
                    <div className="h-8 w-8">
                        <img src="/favicon.ico" alt="" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-orange-700 leading-none">SaathiHire</span>
                        <span className="text-[10px] font-medium text-green-700 tracking-wider">CONNECTING SKILLS. SOLVING NEEDS.</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {(!user || userProfile?.role === 'citizen') && (
                        <>
                            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Home</Link>
                            <Link to="/search" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Find Workers</Link>
                            <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Pricing</Link>
                        </>
                    )}

                    {!user && (
                        <Link to="/jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Find Jobs</Link>
                    )}

                    {userProfile?.role === 'citizen' && (
                        <>
                            <Link to="/scheduled-jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Scheduled Jobs</Link>
                            <Link to="/post-job" className="text-sm font-medium text-orange-700 hover:text-orange-800 transition-colors">Post a Job</Link>
                        </>
                    )}

                    {userProfile?.role === 'worker' && (
                        <>
                            <Link to="/jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Find Jobs</Link>
                            <Link to="/invites" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Invites</Link>
                            <Link to="/scheduled-jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">Scheduled Jobs</Link>
                        </>
                    )}
                </nav>

                {/* Auth Buttons - Desktop Only */}
                <div className="hidden md:flex items-center gap-4">
                    {!user ? (
                        <Link to="/login">
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">Sign In</Button>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-gray-200" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold border border-orange-200">
                                        {user.name?.charAt(0) || "U"}
                                    </div>
                                )}
                                <span className="text-sm font-medium text-gray-700">My Profile</span>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                Logout
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden ml-auto text-gray-700" onClick={toggleMenu}>
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-white px-4 py-4 space-y-4 shadow-lg">
                    <nav className="flex flex-col gap-4">
                        {(!user || userProfile?.role === 'citizen') && (
                            <>
                                <Link to="/" className="text-sm font-medium text-gray-700 hover:text-orange-600" onClick={toggleMenu}>Home</Link>
                                <Link to="/search" className="text-sm font-medium text-gray-700 hover:text-orange-600" onClick={toggleMenu}>Find Workers</Link>
                                <Link to="/pricing" className="text-sm font-medium text-gray-700 hover:text-orange-600" onClick={toggleMenu}>Pricing</Link>
                            </>
                        )}

                        {!user && (
                            <>
                                <Link to="/jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600" onClick={toggleMenu}>Find Jobs</Link>
                                <Link to="/login" className="text-sm font-medium text-orange-600" onClick={toggleMenu}>Sign In</Link>
                            </>
                        )}

                        {userProfile?.role === 'citizen' && (
                            <>
                                <Link to="/scheduled-jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors" onClick={toggleMenu}>Scheduled Jobs</Link>
                                <Link to="/post-job" className="text-sm font-medium text-orange-600" onClick={toggleMenu}>Post a Job</Link>
                            </>
                        )}
                        {userProfile?.role === 'worker' && (
                            <>
                                <Link to="/jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600" onClick={toggleMenu}>Find Jobs</Link>
                                <Link to="/invites" className="text-sm font-medium text-gray-700 hover:text-orange-600" onClick={toggleMenu}>Invites</Link>
                                <Link to="/scheduled-jobs" className="text-sm font-medium text-gray-700 hover:text-orange-600" onClick={toggleMenu}>Scheduled Jobs</Link>
                            </>
                        )}
                        {user && (
                            <>
                                <button className="text-sm font-medium text-left text-red-600" onClick={() => { logout(); toggleMenu(); }}>Logout</button>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    )
}
