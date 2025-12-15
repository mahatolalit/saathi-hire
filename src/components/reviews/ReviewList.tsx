import { useEffect, useState } from "react"
import { databases, APPWRITE_CONFIG } from "../../lib/appwrite"
import { Query } from "appwrite"
import { Star } from "lucide-react"

interface Review {
    $id: string
    workerId: string
    rating: number
    comment: string
    reviewerName: string
    createdAt: string
}

export function ReviewList({ workerId }: { workerId: string }) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_REVIEWS,
                    [
                        Query.equal('workerId', workerId),
                        Query.orderDesc('createdAt')
                    ]
                )
                setReviews(response.documents as unknown as Review[])
            } catch (error) {
                console.error("Error fetching reviews", error)
            } finally {
                setLoading(false)
            }
        }

        if (workerId) {
            fetchReviews()
        }
    }, [workerId])

    if (loading) return <div>Loading reviews...</div>
    if (reviews.length === 0) return <div className="text-gray-500">No reviews yet.</div>

    return (
        <div className="space-y-4">
            {reviews.map(review => (
                <div key={review.$id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{review.reviewerName}</span>
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-sm font-bold">{review.rating}</span>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                    <div className="text-xs text-gray-400 mt-1">
                        {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    )
}
