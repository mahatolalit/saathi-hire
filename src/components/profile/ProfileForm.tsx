import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { useAuth } from "../../context/AuthContext"
import { databases, storage, account, APPWRITE_CONFIG } from "../../lib/appwrite"
import { ID } from "appwrite"
import { type WorkerProfile, WORKER_CATEGORIES } from "../../types"
import { useNavigate } from "react-router-dom"
import { CheckCircle, XCircle } from "lucide-react"

interface ProfileFormProps {
    initialData: WorkerProfile
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const { user, refreshProfile } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [photoFile, setPhotoFile] = useState<File | null>(null)

    // Phone Verification State
    const [phone, setPhone] = useState(initialData.phone || "")
    const [password, setPassword] = useState("")
    const [otp, setOtp] = useState("")
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [phoneVerified, setPhoneVerified] = useState(initialData.phoneVerified || false)
    const [verifying, setVerifying] = useState(false)

    const { register, handleSubmit } = useForm<WorkerProfile>({
        defaultValues: initialData
    })

    const handleSendOtp = async () => {
        if (!phone || !password) {
            alert("Please enter phone number and your current password to verify.")
            return
        }
        setVerifying(true)
        try {
            // 1. Update Phone on Account
            await account.updatePhone(phone, password)

            // 2. Create Verification
            await account.createPhoneVerification()

            setShowOtpInput(true)
            alert("OTP sent to your phone!")
        } catch (error: any) {
            console.error("Error sending OTP", error)
            alert(error.message || "Failed to send OTP. Please check your password.")
        } finally {
            setVerifying(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!user || !otp) return
        setVerifying(true)
        try {
            // 3. Verify OTP
            await account.updatePhoneVerification(user.$id, otp)

            // 4. Update Database Status
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_USERS,
                user.$id,
                {
                    phoneVerified: true,
                    phone: phone // Ensure phone is also saved if not already
                }
            )

            setPhoneVerified(true)
            setShowOtpInput(false)
            await refreshProfile() // Refresh context
            alert("Phone verified successfully!")
        } catch (error: any) {
            console.error("Error verifying OTP", error)
            alert(error.message || "Invalid OTP")
        } finally {
            setVerifying(false)
        }
    }

    const onSubmit = async (data: WorkerProfile) => {
        if (!user) return
        setLoading(true)

        try {
            let photoURL = initialData.photoURL

            if (photoFile) {
                // Upload to Appwrite Storage
                const fileUpload = await storage.createFile(
                    APPWRITE_CONFIG.BUCKET_ID,
                    ID.unique(),
                    photoFile
                )

                // Get View URL
                const result = storage.getFileView(APPWRITE_CONFIG.BUCKET_ID, fileUpload.$id)
                photoURL = result.toString()
            }

            // Update Profile in Database
            // Update Users Collection (Common Data)
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_USERS,
                user.$id,
                {
                    photoURL,
                    phone,
                    phoneVerified
                }
            )

            // Update Workers Collection (Worker Data)
            if (initialData.role === 'worker') {
                const workerData = {
                    category: data.category,
                    experience: Number(data.experience),
                    dailyRateMin: Number(data.dailyRateMin),
                    dailyRateMax: Number(data.dailyRateMax),
                    bio: data.bio
                }

                try {
                    await databases.updateDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_WORKERS,
                        user.$id,
                        workerData
                    )
                } catch (error: any) {
                    if (error.code === 404) {
                        // Worker document doesn't exist, create it
                        await databases.createDocument(
                            APPWRITE_CONFIG.DATABASE_ID,
                            APPWRITE_CONFIG.COLLECTION_WORKERS,
                            user.$id,
                            {
                                ...workerData
                            }
                        )
                    } else {
                        throw error
                    }
                }
            }

            await refreshProfile()
            navigate('/profile')
        } catch (error) {
            console.error("Error updating profile", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-xl shadow">
            <div className="space-y-2">
                <label className="text-sm font-medium">Profile Photo</label>
                <div className="flex items-center gap-4">
                    {initialData.photoURL && (
                        <img src={initialData.photoURL} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
                    )}
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                setPhotoFile(e.target.files[0])
                            }
                        }}
                    />
                </div>
            </div>

            {/* Phone Verification Section */}
            <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                <h3 className="font-medium">Phone Verification</h3>

                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Phone Number (e.g. +919876543210)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={phoneVerified}
                    />
                    {phoneVerified ? (
                        <div className="flex items-center gap-1 text-green-600 font-medium whitespace-nowrap">
                            <CheckCircle className="h-5 w-5" /> Verified
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-red-500 font-medium whitespace-nowrap">
                            <XCircle className="h-5 w-5" /> Not Verified
                        </div>
                    )}
                </div>

                {!phoneVerified && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500">Current Password (Required to update phone)</label>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {!showOtpInput ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSendOtp}
                                disabled={verifying || !phone || !password}
                            >
                                {verifying ? "Sending..." : "Send Verification OTP"}
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={verifying || !otp}
                                >
                                    {verifying ? "Verifying..." : "Verify OTP"}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {initialData.role === 'worker' && (
                <>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <select
                            {...register("category", { required: true })}
                            className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                        >
                            <option value="">Select a category</option>
                            {WORKER_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Experience (Years)</label>
                            <Input
                                type="number"
                                {...register("experience", { required: true, min: 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Daily Rate (₹)</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Min"
                                    type="number"
                                    {...register("dailyRateMin", { required: true, min: 0 })}
                                />
                                <Input
                                    placeholder="Max"
                                    type="number"
                                    {...register("dailyRateMax", { required: true, min: 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                            {...register("bio")}
                            className="flex min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                            placeholder="Tell us about your skills and services..."
                        />
                    </div>
                </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
            </Button>
        </form>
    )
}
