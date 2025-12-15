import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { type WorkerProfile } from "../types"
import { Badge } from "../components/ui/Badge"
import { Button } from "../components/ui/Button"
import { MapPin, Star, Phone, MessageCircle, Clock, IndianRupee, CheckCircle, AlertCircle, Send } from "lucide-react"
import { ReviewList } from "../components/reviews/ReviewList"
import { OfferModal } from "../components/ui/OfferModal"
import { useAuth } from "../context/AuthContext"

export function WorkerProfileView() {
    const { id } = useParams()
    const { user } = useAuth()
    const [worker, setWorker] = useState<WorkerProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [offerModalOpen, setOfferModalOpen] = useState(false)

    useEffect(() => {
        const fetchWorker = async () => {
            if (!id) return
            try {
                const userDoc = await databases.getDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_USERS,
                    id
                )
                let workerData = userDoc as unknown as WorkerProfile

                try {
                    const workerDoc = await databases.getDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_WORKERS,
                        id
                    )
                    workerData = { ...workerData, ...workerDoc }
                } catch (e) {
                    console.log("Worker details not found")
                }

                setWorker(workerData)
            } catch (error) {
                console.error("Error fetching worker", error)
            } finally {
                setLoading(false)
            }
        }
        fetchWorker()
    }, [id])

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!worker) return <div className="p-8 text-center">Worker not found</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Photo & Contact */}
                <div className="md:col-span-1 space-y-6">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        {worker.photoURL ? (
                            <img src={worker.photoURL || undefined} alt={worker.displayName || "Worker"} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Button className="w-full gap-2" size="lg">
                            <Phone className="h-4 w-4" /> Call Now
                        </Button>
                        <Button variant="outline" className="w-full gap-2" size="lg">
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                        </Button>
                        {user && user.$id !== id && (
                            <Button
                                className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                                size="lg"
                                onClick={() => setOfferModalOpen(true)}
                            >
                                <Send className="h-4 w-4" /> Offer Work
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-2 space-y-8">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold">{worker.displayName}</h1>
                                <div className="flex items-center gap-2 mt-2 text-gray-500">
                                    <MapPin className="h-4 w-4" />
                                    <span>{worker.pincode}</span>
                                    <Badge variant="secondary">{worker.category}</Badge>
                                </div>
                                <div className="mt-2">
                                    {worker.phoneVerified || worker.verificationMethod ? (
                                        <Badge variant="secondary" className="w-fit bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 text-xs">
                                            <CheckCircle className="h-3 w-3" />
                                            Verified {worker.verificationMethod || "Phone"}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 gap-1 text-xs">
                                            <AlertCircle className="h-3 w-3" />
                                            Unverified
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-yellow-700">{worker.rating || "New"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Experience</span>
                            </div>
                            <p className="font-semibold">{worker.experience} Years</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <IndianRupee className="h-4 w-4" />
                                <span className="text-sm">Daily Rate</span>
                            </div>
                            <p className="font-semibold">₹{worker.dailyRateMin} - ₹{worker.dailyRateMax}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">About</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {worker.bio || "No bio provided."}
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Languages</h3>
                        <div className="flex flex-wrap gap-2">
                            {worker.languages?.map(lang => (
                                <Badge key={lang} variant="outline">{lang}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 border-t">
                        <h3 className="font-semibold mb-6">Reviews</h3>
                        <ReviewList workerId={id!} />
                    </div>
                </div>
            </div>

            <OfferModal
                isOpen={offerModalOpen}
                onClose={() => setOfferModalOpen(false)}
                workerId={id!}
                workerName={worker.displayName || "Worker"}
            />
        </div>
    )
}
