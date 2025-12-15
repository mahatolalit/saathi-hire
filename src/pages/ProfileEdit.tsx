import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { ProfileForm } from "../components/profile/ProfileForm"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { type WorkerProfile } from "../types"
import { useNavigate } from "react-router-dom"

export default function ProfileEdit() {
    const { user, userProfile } = useAuth()
    const navigate = useNavigate()
    const [initialData, setInitialData] = useState<WorkerProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userProfile) {
            setInitialData(userProfile as WorkerProfile)
            setLoading(false)
        } else if (user) {
            // Fallback if userProfile not in context yet (shouldn't happen due to RequireProfile)
            // But for safety:
            const fetchProfile = async () => {
                try {
                    const doc = await databases.getDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_USERS,
                        user.$id
                    )
                    let profileData = doc as unknown as WorkerProfile

                    if (doc.role === 'worker') {
                        try {
                            const workerDoc = await databases.getDocument(
                                APPWRITE_CONFIG.DATABASE_ID,
                                APPWRITE_CONFIG.COLLECTION_WORKERS,
                                user.$id
                            )
                            profileData = { ...profileData, ...workerDoc }
                        } catch (e) {
                            console.log("Worker profile not found")
                        }
                    }

                    setInitialData(profileData)
                } catch (error) {
                    console.error("Error fetching profile", error)
                } finally {
                    setLoading(false)
                }
            }
            fetchProfile()
        }
    }, [user, userProfile])

    if (loading) return <div className="p-8 text-center">Loading...</div>

    if (!user) {
        navigate('/login')
        return null
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
            {initialData && (
                <ProfileForm initialData={initialData} />
            )}
        </div>
    )
}
