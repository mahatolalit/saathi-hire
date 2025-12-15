import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { Query } from "appwrite"
import type { Invite } from "../types"
import { Badge } from "../components/ui/Badge"
import { Calendar, IndianRupee, Clock, Phone, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { StatusModal } from "../components/ui/StatusModal"
import { ConfirmationModal } from "../components/ui/ConfirmationModal"
import { ReviewModal } from "../components/ui/ReviewModal"
import { Permission, Role } from "appwrite"
import type { UserProfile } from "../types"

export default function ScheduledJobs() {
    const { user, userProfile } = useAuth()
    const navigate = useNavigate()
    const [jobs, setJobs] = useState<Invite[]>([])
    const [loading, setLoading] = useState(true)
    const [statusModal, setStatusModal] = useState<{ open: boolean, status: 'success' | 'error', message: string }>({
        open: false,
        status: 'success',
        message: ''
    })
    const [confirmationModal, setConfirmationModal] = useState<{ open: boolean, inviteId: string | null }>({ open: false, inviteId: null })
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [selectedWorkerForReview, setSelectedWorkerForReview] = useState<{ id: string, name: string, jobId: string } | null>(null)

    useEffect(() => {
        if (!user) {
            navigate("/login")
            return
        }
        fetchScheduledJobs()
    }, [user, userProfile])

    const fetchScheduledJobs = async () => {
        if (!user || !userProfile) return
        setLoading(true)
        try {
            let queries = [Query.equal("status", "accepted")]

            if (userProfile.role === 'worker') {
                queries.push(Query.equal("workerId", user.$id))
            } else {
                queries.push(Query.equal("citizenId", user.$id))
            }

            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                queries
            )
            setJobs(response.documents as unknown as Invite[])
        } catch (error) {
            console.error("Error fetching scheduled jobs", error)
        } finally {
            setLoading(false)
        }
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

            // Remove from the list
            const completedJob = jobs.find(job => job.$id === inviteId)
            setJobs(jobs.filter(job => job.$id !== inviteId))

            setStatusModal({ open: true, status: 'success', message: 'Job marked as complete!' })

            // Open Review Modal
            if (completedJob) {
                try {
                    const workerDoc = await databases.getDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_USERS,
                        completedJob.workerId
                    )
                    const workerName = (workerDoc as unknown as UserProfile).displayName || "Worker"

                    setSelectedWorkerForReview({
                        id: completedJob.workerId,
                        name: workerName,
                        jobId: inviteId
                    })
                    setReviewModalOpen(true)
                } catch (e) {
                    console.error("Error fetching worker details for review", e)
                    // Fallback if fetch fails
                    setSelectedWorkerForReview({
                        id: completedJob.workerId,
                        name: "Worker",
                        jobId: inviteId
                    })
                    setReviewModalOpen(true)
                }
            }

        } catch (error) {
            console.error("Error marking job as complete", error)
            setStatusModal({ open: true, status: 'error', message: 'Failed to update status' })
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
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id))
            ]
        )
        // We can close the modal here or show another success message if needed, 
        // but StatusModal is already showing success for job completion.
        // Maybe update StatusModal message?
        setStatusModal({ open: true, status: 'success', message: 'Job completed and review submitted!' })
    }

    if (loading) return <div className="p-8 text-center">Loading scheduled jobs...</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">
                {userProfile?.role === 'worker' ? 'My Upcoming Jobs' : 'Hired Workers'}
            </h1>

            {jobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow">
                    <p className="text-gray-500 text-lg">
                        {userProfile?.role === 'worker'
                            ? "No upcoming jobs scheduled."
                            : "You haven't hired anyone yet."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map(job => (
                        <div key={job.$id} className="bg-white p-6 rounded-xl shadow border border-green-100">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center justify-between md:justify-start gap-3">
                                        <h3 className="text-xl font-semibold text-green-800">
                                            {job.workType}
                                        </h3>
                                        <Badge className="bg-green-600 hover:bg-green-700">
                                            SCHEDULED
                                        </Badge>
                                    </div>

                                    <p className="text-gray-700">
                                        {userProfile?.role === 'worker'
                                            ? <span>Client: <span className="font-medium">{job.citizenName}</span></span>
                                            : <span>Worker ID: <span className="font-medium">{job.workerId.substring(0, 8)}...</span></span>
                                        }
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(job.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <IndianRupee className="h-4 w-4" />
                                            <span className="font-medium text-gray-900">{job.price}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>Booked on {new Date(job.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {job.description && (
                                        <div className="bg-gray-50 p-3 rounded-md mt-3 text-sm text-gray-600">
                                            {job.description}
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-4">
                                        {/* Call Button */}
                                        {(userProfile?.role === 'worker' ? job.citizenPhone : job.workerPhone) && (
                                            <a
                                                href={`tel:${userProfile?.role === 'worker' ? job.citizenPhone : job.workerPhone}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                                            >
                                                <Phone className="h-4 w-4" />
                                                Call {userProfile?.role === 'worker' ? 'Client' : 'Worker'}
                                            </a>
                                        )}

                                        {/* Mark as Complete Button (Citizen only) */}
                                        {userProfile?.role === 'citizen' && job.status === 'accepted' && (
                                            <button
                                                onClick={() => handleMarkCompleteClick(job.$id!)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Mark as Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <StatusModal
                isOpen={statusModal.open}
                onClose={() => setStatusModal({ ...statusModal, open: false })}
                status={statusModal.status}
                message={statusModal.message}
            />

            <ConfirmationModal
                isOpen={confirmationModal.open}
                onClose={() => setConfirmationModal({ ...confirmationModal, open: false })}
                onConfirm={handleConfirmComplete}
                title="Mark Job as Complete"
                message="Are you sure you want to mark this job as complete? This action cannot be undone."
                confirmText="Yes, Mark Complete"
            />

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                workerName={selectedWorkerForReview?.name || "Worker"}
                onSubmit={handleReviewSubmit}
            />
        </div>
    )
}
