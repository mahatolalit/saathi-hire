import { Home, Search, UserCircle, PlusCircle } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { useAuth } from "../../context/AuthContext"

export function MobileNav() {
    const location = useLocation()
    const { userProfile } = useAuth()

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: Search, label: "Search", path: "/search" },
        ...(userProfile?.role === 'citizen' ? [{ icon: PlusCircle, label: "Post Job", path: "/post-job" }] : []),
        { icon: UserCircle, label: "Profile", path: "/profile" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white px-4 py-2 md:hidden">
            <div className="flex justify-around">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    const isProfile = item.label === "Profile"

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors",
                                isActive ? "text-primary-600" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {isProfile && userProfile?.photoURL ? (
                                <img
                                    src={userProfile.photoURL}
                                    alt="Profile"
                                    className={cn("h-6 w-6 rounded-full object-cover", isActive && "ring-2 ring-primary-600")}
                                />
                            ) : (
                                <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            )}
                            {item.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
