import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useSearchParams } from "react-router-dom"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { Query, Permission, Role } from "appwrite"
import { type Job, WORKER_CATEGORIES } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { MapPin, Clock, IndianRupee, Search as SearchIcon } from "lucide-react"
import { AddressSearch } from "../components/ui/AddressSearch"
import { Modal } from "../components/ui/Modal"

export default function FindJobs() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)

    const initialPincode = searchParams.get("pincode") || ""
    const initialCategory = searchParams.get("category") || ""

    const [pincode, setPincode] = useState(initialPincode)
    const [category, setCategory] = useState(initialCategory)

    const handleSearch = async () => {
        setLoading(true)
        setSearchParams({ pincode, category })

        try {
            const queries = [Query.orderDesc('createdAt')]

            if (pincode) {
                queries.push(Query.equal("location", pincode))
            }
            if (category) {
                queries.push(Query.equal("category", category))
            }

            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_JOBS,
                queries
            )
            setJobs(response.documents as unknown as Job[])
        } catch (error) {
            console.error("Error fetching jobs", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        handleSearch()
    }, [])

    const [applying, setApplying] = useState<string | null>(null)
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, type: 'success' | 'error' }>({
        isOpen: false,
        title: "",
        message: "",
        type: 'success'
    })
    const { user, userProfile } = useAuth()

    const handleApply = async (job: Job) => {
        if (!user || !userProfile) {
            setModalConfig({
                isOpen: true,
                title: "Login Required",
                message: "Please login to apply for jobs.",
                type: 'error'
            })
            return
        }

        setApplying(job.$id!)
        try {
            // Check if already applied
            const existingApps = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'applications',
                [
                    Query.equal("jobId", job.$id!),
                    Query.equal("workerId", user.$id)
                ]
            )

            if (existingApps.total > 0) {
                setModalConfig({
                    isOpen: true,
                    title: "Already Applied",
                    message: "You have already submitted an application for this job.",
                    type: 'error'
                })
                setApplying(null)
                return
            }

            // Create Application
            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                'applications',
                'unique()',
                {
                    jobId: job.$id,
                    workerId: user.$id,
                    status: 'pending',
                    jobTitle: job.title,
                    jobLocation: job.location,
                    workerName: user.name,
                    workerPhone: userProfile.phone || "Not provided"
                },
                [
                    Permission.read(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.user(user.$id))
                ]
            )
            setModalConfig({
                isOpen: true,
                title: "Application Submitted",
                message: "Your application has been sent successfully! The job poster will review it shortly.",
                type: 'success'
            })
        } catch (error: any) {
            console.error("Error applying for job", error)
            setModalConfig({
                isOpen: true,
                title: "Application Failed",
                message: "Server error. Please try again later",
                type: 'error'
            })
        } finally {
            setApplying(null)
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Available Jobs</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-8 items-start">
                <div className="w-full md:w-64">
                    <AddressSearch onPincodeSelect={setPincode} />
                    <div className="mt-1 text-xs text-gray-400">Pincode: {pincode}</div>
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full md:w-64 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                >
                    <option value="">All Categories</option>
                    {WORKER_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <Button onClick={handleSearch} disabled={loading} className="gap-2">
                    <SearchIcon className="h-4 w-4" /> Search
                </Button>
            </div>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : jobs.length === 0 ? (
                <div className="text-center text-gray-500">No jobs found. Try different filters.</div>
            ) : (
                <div className="grid gap-6">
                    {jobs.map(job => (
                        <Card key={job.id || job.$id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{job.title}</CardTitle>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                            <span className="font-medium text-primary-600">{job.postedByName}</span>
                                            <span>•</span>
                                            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Badge>{job.category}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-4">{job.description}</p>
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <IndianRupee className="h-4 w-4" />
                                        <span className="font-semibold text-gray-900">₹{job.budget}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="capitalize">{job.status}</span>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        onClick={() => handleApply(job)}
                                        disabled={applying === job.$id}
                                    >
                                        {applying === job.$id ? "Applying..." : "Apply Now"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
            >
                <div className="space-y-4">
                    <p className={modalConfig.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                        {modalConfig.message}
                    </p>
                    <div className="flex justify-end">
                        <Button onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
