import { useState } from "react"
import { Modal } from "./Modal"
import { Button } from "./Button"
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite"
import { useAuth } from "../../context/AuthContext"
import { Permission, Role } from "appwrite"
import { WORKER_CATEGORIES } from "../../types"
import { StatusModal } from "./StatusModal"

interface OfferModalProps {
    isOpen: boolean
    onClose: () => void
    workerId: string
    workerName: string
}

export function OfferModal({ isOpen, onClose, workerId, workerName }: OfferModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        workType: "",
        customWorkType: "",
        price: "",
        date: "",
        description: ""
    })
    const [statusModal, setStatusModal] = useState<{ open: boolean, status: 'success' | 'error', message: string }>({
        open: false,
        status: 'success',
        message: ''
    })

    const handleStatusClose = () => {
        setStatusModal(prev => ({ ...prev, open: false }))
        if (statusModal.status === 'success') {
            onClose()
            setFormData({ workType: "", customWorkType: "", price: "", date: "", description: "" })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)

        console.log("Debug: Sending offer", {
            citizenId: user.$id,
            workerId
        })

        if (!workerId) {
            console.error("Error: workerId is missing")
            setStatusModal({ open: true, status: 'error', message: 'Invalid worker ID' })
            setLoading(false)
            return
        }

        try {
            // Fetch worker details to get phone number
            const workerDoc = await databases.getDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_WORKERS,
                workerId
            )

            // Get citizen details (current user)
            const citizenDoc = await databases.getDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_USERS,
                user.$id
            )

            await databases.createDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                'invites', // New collection
                'unique()',
                {
                    citizenId: user.$id,
                    citizenName: user.name,
                    citizenPhone: citizenDoc.phone,
                    workerId: workerId.trim(),
                    workerPhone: workerDoc.phone,
                    workType: formData.workType === 'Other' ? formData.customWorkType : formData.workType,
                    customWorkType: formData.workType === 'Other' ? formData.customWorkType : null,
                    price: parseInt(formData.price),
                    date: formData.date,
                    description: formData.description,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                }
            )
            setStatusModal({ open: true, status: 'success', message: 'Offer sent successfully!' })
        } catch (error: any) {
            console.error("Error sending offer", error)
            if (error.response) {
                console.error("Appwrite Error Response:", error.response)
            }
            setStatusModal({ open: true, status: 'error', message: error.message || 'Server error. Try again later' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Send Offer to ${workerName}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                        <select
                            required
                            className="w-full p-2 border rounded-md"
                            value={formData.workType}
                            onChange={e => setFormData({ ...formData, workType: e.target.value })}
                        >
                            <option value="">Select Work Type</option>
                            {WORKER_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {formData.workType === 'Other' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specify Work</label>
                            <input
                                type="text"
                                required
                                className="w-full p-2 border rounded-md"
                                value={formData.customWorkType}
                                onChange={e => setFormData({ ...formData, customWorkType: e.target.value })}
                                placeholder="e.g. Furniture Assembly"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price Offer (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                className="w-full p-2 border rounded-md"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border rounded-md"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                            className="w-full p-2 border rounded-md"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the work in detail..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {loading ? "Sending..." : "Send Offer"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <StatusModal
                isOpen={statusModal.open}
                onClose={handleStatusClose}
                status={statusModal.status}
                message={statusModal.message}
            />
        </>
    )
}
