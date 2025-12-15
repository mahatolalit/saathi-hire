import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

interface RequireRoleProps {
    allowedRoles: ('citizen' | 'worker')[]
}

export function RequireRole({ allowedRoles }: RequireRoleProps) {
    const { userProfile, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    if (!userProfile) {
        return <Navigate to="/onboarding" />
    }

    if (!allowedRoles.includes(userProfile.role)) {
        return <Navigate to="/" />
    }

    return <Outlet />
}
