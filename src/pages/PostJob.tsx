import { useAuth } from "../context/AuthContext"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { ID } from "appwrite"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { useNavigate } from "react-router-dom"
import { WORKER_CATEGORIES, type Job } from "../types"

export default function PostJob() {
    const { user, userProfile } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit } = useForm<Job>()

    // Enforce Citizen Role
    if (userProfile && userProfile.role !== 'citizen') {
        navigate('/')
        return null
    }

    const onSubmit = async (data: Job) => {
        if (!user || !userProfile) return
        setLoading(true)

        try {
            // Create job in Appwrite
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_JOBS,
                ID.unique(),
                {
                    ...data,
                    postedBy: user.$id,
                    postedByName: userProfile.displayName || user.name,
                    createdAt: new Date().toISOString(),
                    status: 'open',
                    budget: Number(data.budget)
                }
            )

            navigate('/jobs')
        } catch (error) {
            console.error("Error posting job", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto px-4 max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-8">Post a Job</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-xl shadow">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <Input
                        {...register("title", { required: true })}
                        placeholder="e.g. Need a plumber for leaking tap"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                        {...register("category", { required: true })}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                    >
                        <option value="">Select Category</option>
                        {WORKER_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        {...register("description", { required: true })}
                        className="flex min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                        placeholder="Describe the work in detail..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Budget (₹)</label>
                        <Input
                            type="number"
                            {...register("budget", { required: true })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Location (Pincode)</label>
                        <Input
                            {...register("location", { required: true, minLength: 6, maxLength: 6 })}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Posting..." : "Post Job"}
                </Button>
            </form>
        </div>
    )
}
