import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { Query } from "appwrite"
import type { Invite } from "../types"
import { Button } from "../components/ui/Button"
import { Badge } from "../components/ui/Badge"
import { Calendar, IndianRupee, Clock, CheckCircle, XCircle } from "lucide-react"

import { StatusModal } from "../components/ui/StatusModal"

export default function Invites() {
    const { user } = useAuth()
    const [invites, setInvites] = useState<Invite[]>([])
    const [loading, setLoading] = useState(true)
    const [statusModal, setStatusModal] = useState<{ open: boolean, status: 'success' | 'error', message: string }>({
        open: false,
        status: 'success',
        message: ''
    })

    useEffect(() => {
        fetchInvites()
    }, [user])

    const fetchInvites = async () => {
        if (!user) return
        try {
            const response = await databases.listDocuments(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                [
                    Query.equal("workerId", user.$id),
                    Query.orderDesc("$createdAt")
                ]
            )
            setInvites(response.documents as unknown as Invite[])
        } catch (error) {
            console.error("Error fetching invites", error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (inviteId: string, newStatus: 'accepted' | 'rejected') => {
        try {
            await databases.updateDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites',
                inviteId,
                { status: newStatus }
            )
            // Update local state
            setInvites(invites.map(inv =>
                inv.$id === inviteId ? { ...inv, status: newStatus } : inv
            ))
            setStatusModal({ open: true, status: 'success', message: `Invite ${newStatus} successfully` })
        } catch (error) {
            console.error("Error updating invite status", error)
            setStatusModal({ open: true, status: 'error', message: "Failed to update status" })
        }
    }

    if (loading) return <div className="p-8 text-center">Loading invites...</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Work Invites</h1>

            {invites.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow">
                    <p className="text-gray-500 text-lg">No invites received yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {invites.map(invite => (
                        <div key={invite.$id} className="bg-white p-6 rounded-xl shadow border border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center justify-between md:justify-start gap-3">
                                        <h3 className="text-xl font-semibold text-orange-600">
                                            {invite.workType}
                                        </h3>
                                        <Badge variant={
                                            invite.status === 'accepted' ? 'default' :
                                                invite.status === 'rejected' ? 'destructive' : 'secondary'
                                        }>
                                            {invite.status.toUpperCase()}
                                        </Badge>
                                    </div>

                                    <p className="text-gray-700">
                                        From: <span className="font-medium">{invite.citizenName}</span>
                                    </p>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(invite.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <IndianRupee className="h-4 w-4" />
                                            <span className="font-medium text-gray-900">₹{invite.price}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>Received {new Date(invite.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {invite.description && (
                                        <div className="bg-gray-50 p-3 rounded-md mt-3 text-sm text-gray-600">
                                            {invite.description}
                                        </div>
                                    )}
                                </div>

                                {invite.status === 'pending' && (
                                    <div className="flex md:flex-col justify-end gap-2 min-w-[120px]">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                            onClick={() => handleStatusUpdate(invite.$id!, 'accepted')}
                                        >
                                            <CheckCircle className="h-4 w-4" /> Accept
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
                                            onClick={() => handleStatusUpdate(invite.$id!, 'rejected')}
                                        >
                                            <XCircle className="h-4 w-4" /> Reject
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <StatusModal
                isOpen={statusModal.open}
                onClose={() => setStatusModal(prev => ({ ...prev, open: false }))}
                status={statusModal.status}
                message={statusModal.message}
            />
        </div>
    )
}
