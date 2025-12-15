import { useAuth } from "../context/AuthContext"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export default function Onboarding() {
    const { user, refreshProfile } = useAuth()
    const navigate = useNavigate()
    const [role, setRole] = useState<'citizen' | 'worker' | null>(null)
    const [pincode, setPincode] = useState("")
    const [loading, setLoading] = useState(false)

    const handleComplete = async () => {
        if (!user || !role || !pincode) return

        setLoading(true)
        try {
            const profileData = {
                email: user.email,
                displayName: user.name,
                photoURL: null, // Initial photoURL is null
                role,
                pincode,
                createdAt: new Date().toISOString()
            }

            // Create Profile in Appwrite
            // Using user.$id as document ID to link 1:1
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_USERS,
                user.$id,
                profileData
            )

            if (role === 'worker') {
                await databases.createDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_WORKERS,
                    user.$id,
                    {
                        category: 'Other',
                        experience: 0,
                        dailyRateMin: 0,
                        dailyRateMax: 0,
                        bio: ''
                    }
                )
            }

            await refreshProfile()

            if (role === 'worker') {
                navigate('/profile/edit')
            } else {
                navigate('/')
            }
        } catch (error) {
            console.error("Error saving profile", error)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        navigate('/login')
        return null
    }

    return (
        <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Welcome to SaathiConnect</h1>
                    <p className="text-gray-500 mt-2">Let's get you set up</p>
                </div>

                <div className="space-y-6 bg-white p-8 rounded-xl shadow-lg border">
                    <div className="space-y-4">
                        <label className="text-sm font-medium">I am a...</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                className={`p-4 rounded-lg border-2 transition-all ${role === 'citizen'
                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 hover:border-primary-200'
                                    }`}
                                onClick={() => setRole('citizen')}
                            >
                                <div className="text-2xl mb-2">🏠</div>
                                <div className="font-bold">Citizen</div>
                                <div className="text-xs text-gray-500">Looking for help</div>
                            </button>
                            <button
                                className={`p-4 rounded-lg border-2 transition-all ${role === 'worker'
                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 hover:border-primary-200'
                                    }`}
                                onClick={() => setRole('worker')}
                            >
                                <div className="text-2xl mb-2">🛠️</div>
                                <div className="font-bold">Worker</div>
                                <div className="text-xs text-gray-500">Offering services</div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Pincode</label>
                        <Input
                            placeholder="e.g. 110001"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            maxLength={6}
                        />
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleComplete}
                        disabled={!role || pincode.length !== 6 || loading}
                    >
                        {loading ? "Saving..." : "Continue"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
