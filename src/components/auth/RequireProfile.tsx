import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export function RequireProfile() {
    const { user, userProfile, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    // If not logged in, PrivateRoute should have caught this, but just in case:
    if (!user) {
        return <Navigate to="/login" />
    }

    // If logged in but no profile, redirect to onboarding
    if (!userProfile) {
        return <Navigate to="/onboarding" />
    }

    return <Outlet />
}
