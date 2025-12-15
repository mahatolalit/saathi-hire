import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/Button"
import { useNavigate } from "react-router-dom"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { Query, Permission, Role } from "appwrite"
import type { Job, Application, UserProfile, WorkerProfile, Review, Invite } from "../types"
import { Badge } from "../components/ui/Badge"
import { Trash2, PauseCircle, PlayCircle, Briefcase, Clock, CheckCircle, XCircle, Star, Calendar, IndianRupee, Phone } from "lucide-react"
import { ReviewModal } from "../components/ui/ReviewModal"
import { SuccessModal } from "../components/ui/SuccessModal"
import { ConfirmationModal } from "../components/ui/ConfirmationModal"

export default function Profile() {
    const { user, userProfile, logout, loading, refreshProfile } = useAuth()
    const navigate = useNavigate()

    // State for Citizen
    const [jobs, setJobs] = useState<Job[]>([])
    const [sentOffers, setSentOffers] = useState<Invite[]>([])
    const [completedOffers, setCompletedOffers] = useState<Invite[]>([])

    // State for Worker
    const [applications, setApplications] = useState<Application[]>([])
    const [scheduledJobs, setScheduledJobs] = useState<Invite[]>([])
    const [completedWork, setCompletedWork] = useState<Invite[]>([])
    const [reviews, setReviews] = useState<Review[]>([])
    const [isAvailable, setIsAvailable] = useState(true)

    // UI State
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login")
        }
    }, [user, loading, navigate])

    useEffect(() => {
        if (userProfile) {
            if (userProfile.role === 'citizen') {
                fetchUserJobs()
                fetchSentOffers()
                fetchCompletedOffers()
            } else if (userProfile.role === 'worker') {
                fetchUserApplications()
                fetchScheduledJobs()
                fetchCompletedWork()
                // @ts-ignore - isAvailable might not be in UserProfile type yet if not updated in context
                setIsAvailable((userProfile as WorkerProfile).isAvailable ?? true)
            }
        }
    }, [userProfile])

    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [selectedWorkerForReview, setSelectedWorkerForReview] = useState<{ id: string, name: string, jobId: string } | null>(null)
    const [successModalOpen, setSuccessModalOpen] = useState(false)
    const [confirmationModal, setConfirmationModal] = useState<{ open: boolean, inviteId: string | null }>({ open: false, inviteId: null })

    const handleRateWorker = async (jobId: string) => {
        try {
            // Find the accepted application for this job
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'applications',
                [
                    Query.equal("jobId", jobId),
                    Query.equal("status", "accepted")
                ]
            )

            if (response.documents.length > 0) {
                const app = response.documents[0] as unknown as Application
                setSelectedWorkerForReview({ id: app.workerId, name: app.workerName, jobId: jobId })
                setReviewModalOpen(true)
            } else {
                alert("No accepted worker found for this job.")
            }
        } catch (error) {
            console.error("Error finding worker to rate", error)
            alert("Failed to find worker details")
        }
    }

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!user || !selectedWorkerForReview) return

        // Note: We let the error propagate so the modal can handle it
        await databases.createDocument(
            APPWRITE_CONFIG.DATABASE_ID,
            APPWRITE_CONFIG.COLLECTION_REVIEWS,
            'unique()',
            {
                jobId: selectedWorkerForReview.jobId,
                workerId: selectedWorkerForReview.id,
                citizenId: user.$id,
                reviewerName: user.name,
                rating: rating,
                comment: comment,
                createdAt: new Date().toISOString()
            },
            [
                Permission.read(Role.any()),
                Permission.delete(Role.user(user.$id))
            ]
        )
        setSuccessModalOpen(true)
    }

    const handleMarkCompleteClick = (inviteId: string) => {
        setConfirmationModal({ open: true, inviteId })
    }

    const handleConfirmComplete = async () => {
        const inviteId = confirmationModal.inviteId
        if (!inviteId) return

        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                inviteId,
                { status: 'completed' }
            )

            // Update local state: Remove from sentOffers and add to completedOffers
            const completedOffer = sentOffers.find(offer => offer.$id === inviteId)
            if (completedOffer) {
                setSentOffers(sentOffers.filter(offer => offer.$id !== inviteId))
                setCompletedOffers([...completedOffers, { ...completedOffer, status: 'completed' }])

                // Fetch worker details and open review modal
                try {
                    const workerDoc = await databases.getDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_USERS,
                        completedOffer.workerId
                    )
                    const workerName = (workerDoc as unknown as UserProfile).displayName || "Worker"

                    setSelectedWorkerForReview({
                        id: completedOffer.workerId,
                        name: workerName,
                        jobId: inviteId
                    })
                    setReviewModalOpen(true)
                } catch (e) {
                    console.error("Error fetching worker details for review", e)
                    // Fallback if fetch fails
                    setSelectedWorkerForReview({
                        id: completedOffer.workerId,
                        name: "Worker",
                        jobId: inviteId
                    })
                    setReviewModalOpen(true)
                }
            }
        } catch (error) {
            console.error("Error marking job as complete", error)
            alert('Failed to update status')
        }
    }

    const fetchUserJobs = async () => {
        if (!user) return
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_JOBS,
                [Query.equal("postedBy", user.$id)]
            )
            setJobs(response.documents as unknown as Job[])
        } catch (error) {
            console.error("Error fetching jobs", error)
        }
    }

    const fetchSentOffers = async () => {
        if (!user) return
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                [
                    Query.equal("citizenId", user.$id),
                    Query.notEqual("status", "completed")
                ]
            )
            setSentOffers(response.documents as unknown as Invite[])
        } catch (error) {
            console.error("Error fetching sent offers", error)
        }
    }

    const fetchCompletedOffers = async () => {
        if (!user) return
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                [
                    Query.equal("citizenId", user.$id),
                    Query.equal("status", "completed")
                ]
            )
            setCompletedOffers(response.documents as unknown as Invite[])
        } catch (error) {
            console.error("Error fetching completed offers", error)
        }
    }

    const fetchUserApplications = async () => {
        if (!user) return
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'applications', // Collection ID
                [Query.equal("workerId", user.$id)]
            )
            setApplications(response.documents as unknown as Application[])

            // Fetch reviews for this worker
            const reviewsResponse = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_REVIEWS,
                [Query.equal("workerId", user.$id)]
            )
            setReviews(reviewsResponse.documents as unknown as Review[])
        } catch (error) {
            console.error("Error fetching applications", error)
        }
    }

    const fetchScheduledJobs = async () => {
        if (!user) return
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                [
                    Query.equal("workerId", user.$id),
                    Query.equal("status", "accepted")
                ]
            )
            setScheduledJobs(response.documents as unknown as Invite[])
        } catch (error) {
            console.error("Error fetching scheduled jobs", error)
        }
    }

    const fetchCompletedWork = async () => {
        if (!user) return
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                [
                    Query.equal("workerId", user.$id),
                    Query.equal("status", "completed")
                ]
            )
            setCompletedWork(response.documents as unknown as Invite[])
        } catch (error) {
            console.error("Error fetching completed work", error)
        }
    }

    const toggleJobStatus = async (job: Job) => {
        try {
            const newStatus = job.status === 'open' ? 'closed' : 'open'
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_JOBS,
                job.$id!,
                { status: newStatus }
            )
            // Update local state
            setJobs(jobs.map(j => j.$id === job.$id ? { ...j, status: newStatus } : j))
        } catch (error) {
            console.error("Error updating job status", error)
            alert("Failed to update job status")
        }
    }

    const deleteJob = async (jobId: string) => {
        if (!confirm("Are you sure you want to delete this job?")) return
        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_JOBS,
                jobId
            )
            setJobs(jobs.filter(j => j.$id !== jobId))
        } catch (error) {
            console.error("Error deleting job", error)
            alert("Failed to delete job")
        }
    }

    const toggleAvailability = async () => {
        if (!user) return
        try {
            const newStatus = !isAvailable
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_WORKERS,
                user.$id,
                { isAvailable: newStatus }
            )
            setIsAvailable(newStatus)
            await refreshProfile()
        } catch (error) {
            console.error("Error updating availability", error)
            alert("Failed to update availability")
        }
    }

    const activeApplications = applications.filter(app => !reviews.some(r => r.jobId === app.jobId))
    const completedApplications = applications.filter(app => reviews.some(r => r.jobId === app.jobId))

    if (loading) return <div>Loading...</div>

    if (!user) return null

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Profile Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow space-y-6">
                        <div className="flex items-center gap-4">
                            {userProfile?.photoURL ? (
                                <img src={userProfile.photoURL} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-600">
                                    {user.name?.charAt(0) || "U"}
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold">{user.name}</h2>
                                <p className="text-gray-500 text-sm">{user.email}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Role</span>
                                <span className="font-medium capitalize">{userProfile?.role}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Pincode</span>
                                <span className="font-medium">{userProfile?.pincode}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-500">Phone</span>
                                <div className="flex flex-col items-end">
                                    <span className="font-medium">{userProfile?.phone || "Not added"}</span>
                                    {userProfile?.phoneVerified ? (
                                        <span className="text-xs text-green-600 font-medium">Verified</span>
                                    ) : (
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs text-red-500 font-medium"
                                            onClick={() => navigate('/profile/edit')}
                                        >
                                            Verify Now
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Worker Availability Toggle */}
                            {userProfile?.role === 'worker' && (
                                <div className="flex justify-between py-2 border-b items-center">
                                    <span className="text-gray-500">Availability</span>
                                    <button
                                        onClick={toggleAvailability}
                                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isAvailable
                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                            }`}
                                    >
                                        {isAvailable ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                        {isAvailable ? "Available" : "Busy"}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Button variant="outline" className="w-full" onClick={() => navigate('/profile/edit')}>
                                Edit Profile
                            </Button>
                            <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => logout()}>
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Jobs or Applications */}
                <div className="md:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            className={`py-2 px-4 font-medium text-sm transition-colors relative ${activeTab === 'active' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('active')}
                        >
                            {userProfile?.role === 'worker' ? 'Active Jobs' : 'Active Offers'}
                            {activeTab === 'active' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600"></span>
                            )}
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm transition-colors relative ${activeTab === 'completed' ? 'text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed History
                            {activeTab === 'completed' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600"></span>
                            )}
                        </button>
                    </div>

                    {userProfile?.role === 'citizen' && (
                        <>
                            {activeTab === 'active' && (
                                <>
                                    {/* Sent Offers Section */}
                                    <div className="bg-white p-6 rounded-xl shadow">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-orange-600" />
                                            Sent Offers
                                        </h2>
                                        {sentOffers.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                <p>You haven't sent any offers yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {sentOffers.map(offer => (
                                                    <div key={offer.$id} className="border rounded-lg p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-semibold">{offer.workType}</h3>
                                                                <p className="text-sm text-gray-500">To Worker ID: {offer.workerId.substring(0, 8)}...</p>
                                                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>{new Date(offer.date).toLocaleDateString()}</span>
                                                                    <IndianRupee className="h-3 w-3 ml-2" />
                                                                    <span>{offer.price}</span>
                                                                </div>

                                                                <div className="flex gap-2 mt-3">
                                                                    {/* Call Button for Citizen */}
                                                                    {offer.workerPhone && (
                                                                        <a
                                                                            href={`tel:${offer.workerPhone}`}
                                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
                                                                        >
                                                                            <Phone className="h-3 w-3" />
                                                                            Call Worker
                                                                        </a>
                                                                    )}

                                                                    {/* Mark as Complete Button */}
                                                                    {offer.status === 'accepted' && (
                                                                        <button
                                                                            onClick={() => handleMarkCompleteClick(offer.$id!)}
                                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                                                                        >
                                                                            <CheckCircle className="h-3 w-3" />
                                                                            Complete
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Badge variant={
                                                                offer.status === 'accepted' ? 'default' :
                                                                    offer.status === 'rejected' ? 'destructive' :
                                                                        offer.status === 'completed' ? 'success' : 'secondary'
                                                            }>
                                                                {offer.status.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* My Posted Jobs Section */}
                                    <div className="bg-white p-6 rounded-xl shadow">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Briefcase className="h-5 w-5 text-orange-600" />
                                            My Posted Jobs
                                        </h2>

                                        {jobs.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <p className="mb-4">You haven't listed any jobs yet.</p>
                                                <Button onClick={() => navigate('/post-job')}>Post a Job</Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {jobs.map(job => (
                                                    <div key={job.$id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h3 className="font-semibold text-lg">{job.title}</h3>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <span>{new Date(job.$createdAt).toLocaleDateString()}</span>
                                                                    <span>•</span>
                                                                    <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                                                                        {job.status.toUpperCase()}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleJobStatus(job)}
                                                                    title={job.status === 'open' ? "Pause Job" : "Resume Job"}
                                                                >
                                                                    {job.status === 'open' ? <PauseCircle className="h-4 w-4 text-orange-500" /> : <PlayCircle className="h-4 w-4 text-green-500" />}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteJob(job.$id!)}
                                                                    title="Delete Job"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/job/${job.$id}/applicants`)}
                                                                    title="View Applicants"
                                                                >
                                                                    <Briefcase className="h-4 w-4 text-blue-500" />
                                                                </Button>
                                                                {job.status === 'closed' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRateWorker(job.$id!)}
                                                                        title="Rate Worker"
                                                                    >
                                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-600 text-sm line-clamp-2">{job.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {activeTab === 'completed' && (
                                <div className="bg-white p-6 rounded-xl shadow">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        Completed Jobs
                                    </h2>
                                    {completedOffers.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">
                                            <p>No completed jobs yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {completedOffers.map(offer => (
                                                <div key={offer.$id} className="border rounded-lg p-4 bg-gray-50">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-semibold">{offer.workType}</h3>
                                                            <p className="text-sm text-gray-500">Worker ID: {offer.workerId.substring(0, 8)}...</p>
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{new Date(offer.date).toLocaleDateString()}</span>
                                                                <IndianRupee className="h-3 w-3 ml-2" />
                                                                <span>{offer.price}</span>
                                                            </div>
                                                        </div>
                                                        <Badge variant="success">COMPLETED</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {userProfile?.role === 'worker' && (
                        <>
                            {activeTab === 'active' && (
                                <>
                                    {/* Scheduled Jobs Section */}
                                    <div className="bg-white p-6 rounded-xl shadow">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-orange-600" />
                                            Scheduled Jobs
                                        </h2>
                                        {scheduledJobs.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                <p>No upcoming jobs scheduled.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {scheduledJobs.map(job => (
                                                    <div key={job.$id} className="border rounded-lg p-4 bg-green-50 border-green-100">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-semibold text-green-800">{job.workType}</h3>
                                                                <p className="text-sm text-gray-600">Client: {job.citizenName}</p>
                                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar className="h-4 w-4" />
                                                                        <span>{new Date(job.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <IndianRupee className="h-4 w-4" />
                                                                        <span className="font-medium">{job.price}</span>
                                                                    </div>
                                                                </div>
                                                                {job.description && (
                                                                    <p className="text-xs text-gray-500 mt-2 bg-white p-2 rounded border border-green-100">{job.description}</p>
                                                                )}

                                                                {/* Call Button for Worker */}
                                                                {job.citizenPhone && (
                                                                    <div className="mt-3">
                                                                        <a
                                                                            href={`tel:${job.citizenPhone}`}
                                                                            className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-green-200 text-green-700 rounded-md hover:bg-green-50 transition-colors text-xs font-medium"
                                                                        >
                                                                            <Phone className="h-3 w-3" />
                                                                            Call Client
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Badge className="bg-green-600">ACCEPTED</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* My Applications Section */}
                                    <div className="bg-white p-6 rounded-xl shadow">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Briefcase className="h-5 w-5 text-orange-600" />
                                            My Applications
                                        </h2>

                                        {activeApplications.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <p className="mb-4">You haven't applied to any active jobs yet.</p>
                                                <Button onClick={() => navigate('/jobs')}>Find Jobs</Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {activeApplications.map(app => {
                                                    return (
                                                        <div key={app.$id} className="border rounded-lg p-4">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="font-semibold">{app.jobTitle || "Job Application"}</h3>
                                                                    <p className="text-sm text-gray-500">{app.jobLocation}</p>
                                                                    <p className="text-xs text-gray-400 mt-1">Applied on {new Date(app.$createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <Badge variant={
                                                                    app.status === 'accepted' ? 'secondary' :
                                                                        app.status === 'rejected' ? 'destructive' : 'secondary'
                                                                }>
                                                                    {app.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {activeTab === 'completed' && (
                                <>
                                    <div className="bg-white p-6 rounded-xl shadow">
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            Completed Work
                                        </h2>
                                        {completedWork.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                <p>No completed work yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {completedWork.map(job => (
                                                    <div key={job.$id} className="border rounded-lg p-4 bg-gray-50">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-semibold">{job.workType}</h3>
                                                                <p className="text-sm text-gray-500">Client: {job.citizenName}</p>
                                                                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>{new Date(job.date).toLocaleDateString()}</span>
                                                                    <IndianRupee className="h-3 w-3 ml-2" />
                                                                    <span>{job.price}</span>
                                                                </div>
                                                            </div>
                                                            <Badge variant="success">COMPLETED</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {completedApplications.length > 0 && (
                                        <div className="bg-white p-6 rounded-xl shadow mt-6">
                                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <Briefcase className="h-5 w-5 text-green-600" />
                                                Completed Applications
                                            </h2>
                                            <div className="space-y-4">
                                                {completedApplications.map(app => {
                                                    const review = reviews.find(r => r.jobId === app.jobId)
                                                    return (
                                                        <div key={app.$id} className="border rounded-lg p-4 bg-gray-50">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="font-semibold">{app.jobTitle || "Job Application"}</h3>
                                                                    <p className="text-sm text-gray-500">{app.jobLocation}</p>
                                                                    <p className="text-xs text-gray-400 mt-1">Applied on {new Date(app.$createdAt).toLocaleDateString()}</p>

                                                                    {review && (
                                                                        <div className="mt-3 bg-white p-3 rounded-md border border-gray-100">
                                                                            <div className="flex items-center gap-1 mb-1">
                                                                                {[...Array(5)].map((_, i) => (
                                                                                    <Star
                                                                                        key={i}
                                                                                        className={`h-3 w-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                                                                    />
                                                                                ))}
                                                                                <span className="text-xs font-medium ml-1">{review.rating}.0</span>
                                                                            </div>
                                                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Badge variant="success">COMPLETED</Badge>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                onSubmit={handleReviewSubmit}
                workerName={selectedWorkerForReview?.name || "Worker"}
            />

            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                message="Review submitted successfully!"
            />

            <ConfirmationModal
                isOpen={confirmationModal.open}
                onClose={() => setConfirmationModal({ ...confirmationModal, open: false })}
                onConfirm={handleConfirmComplete}
                title="Mark Job as Complete"
                message="Are you sure you want to mark this job as complete? This action cannot be undone."
                confirmText="Yes, Mark Complete"
            />
        </div>
    )
}
