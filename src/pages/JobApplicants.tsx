import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { Query, Permission, Role } from "appwrite"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { ArrowLeft, Phone, Star, CheckCircle, PhoneCall } from "lucide-react"
import { type Application, type Job } from "../types"
import { ReviewModal } from "../components/ui/ReviewModal"
import { Modal } from "../components/ui/Modal"
import { SuccessModal } from "../components/ui/SuccessModal"

export default function JobApplicants() {
    const { jobId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [job, setJob] = useState<Job | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [selectedWorkerForReview, setSelectedWorkerForReview] = useState<{ id: string, name: string } | null>(null)

    // Confirmation Modal State
    const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
    const [workerToComplete, setWorkerToComplete] = useState<{ id: string, name: string } | null>(null)

    // Success Modal State
    const [successModalOpen, setSuccessModalOpen] = useState(false)

    useEffect(() => {
        if (jobId) {
            fetchJobAndApplicants()
        }
    }, [jobId])

    const fetchJobAndApplicants = async () => {
        try {
            // Fetch Job Details
            const jobDoc = await databases.getDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_JOBS,
                jobId!
            )
            setJob(jobDoc as unknown as Job)

            // Fetch Applications
            const appResponse = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'applications',
                [Query.equal("jobId", jobId!)]
            )
            setApplications(appResponse.documents as unknown as Application[])
        } catch (error) {
            console.error("Error fetching data", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteOrder = (workerId: string, workerName: string) => {
        setWorkerToComplete({ id: workerId, name: workerName })
        setConfirmationModalOpen(true)
    }

    const confirmCompleteOrder = async () => {
        if (!workerToComplete) return

        try {
            // Update job status to closed
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_JOBS,
                jobId!,
                { status: 'closed' }
            )
            setJob(prev => prev ? { ...prev, status: 'closed' } : null)

            // Close confirmation and open review modal
            setConfirmationModalOpen(false)
            setSelectedWorkerForReview(workerToComplete)
            setReviewModalOpen(true)
        } catch (error) {
            console.error("Error completing order", error)
            alert("Failed to complete order")
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
                jobId: jobId!,
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
        setSuccessModalOpen(true)
    }

    const updateStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                'applications',
                applicationId,
                { status: newStatus }
            )
            // Update local state
            setApplications(apps => apps.map(app =>
                app.$id === applicationId ? { ...app, status: newStatus } : app
            ))
        } catch (error) {
            console.error("Error updating status", error)
            alert("Failed to update status")
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!job) return <div className="p-8 text-center">Job not found</div>

    // Security check: Only the job poster can view applicants
    if (user && job.postedBy !== user.$id) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Unauthorized</h2>
                <p className="text-gray-600 mt-2">You do not have permission to view applicants for this job.</p>
                <Button variant="ghost" onClick={() => navigate('/jobs')} className="mt-4">
                    Back to Jobs
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Profile
            </Button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <p className="text-gray-500">Applicants for this job</p>
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No applications received yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map(app => (
                        <div key={app.$id} className="bg-white border rounded-xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{app.workerName}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            <span>{app.workerPhone}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                            <span>4.5 (12 reviews)</span> {/* Placeholder rating */}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400">Applied on {new Date(app.$createdAt).toLocaleDateString()}</p>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <Badge variant={
                                        app.status === 'accepted' ? 'default' :
                                            app.status === 'rejected' ? 'destructive' : 'secondary'
                                    }>
                                        {app.status.toUpperCase()}
                                    </Badge>

                                    {app.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => updateStatus(app.$id!, 'rejected')}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => updateStatus(app.$id!, 'accepted')}
                                            >
                                                Accept
                                            </Button>
                                        </div>
                                    )}

                                    {app.status === 'accepted' && (
                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                            <div className="flex gap-2">
                                                <a href={`tel:${app.workerPhone}`} className="w-full">
                                                    <Button size="sm" variant="outline" className="w-full gap-2">
                                                        <PhoneCall className="h-4 w-4" />
                                                        Call
                                                    </Button>
                                                </a>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                                    onClick={() => handleCompleteOrder(app.workerId, app.workerName)}
                                                    disabled={job.status === 'closed'}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    {job.status === 'closed' ? 'Completed' : 'Complete Order'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                onSubmit={handleReviewSubmit}
                workerName={selectedWorkerForReview?.name || "Worker"}
            />

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmationModalOpen}
                onClose={() => setConfirmationModalOpen(false)}
                title="Complete Order"
            >
                <div className="space-y-6">
                    <p className="text-gray-600">
                        Are you sure you want to mark this order as complete? This will close the job and you'll be asked to review the worker.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmationModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={confirmCompleteOrder}
                        >
                            Confirm & Review
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Success Modal */}
            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                message="Review submitted successfully!"
            />
        </div>
    )
}
