import { useState } from "react"
import { Modal } from "./Modal"
import { Button } from "./Button"
import { Star } from "lucide-react"

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (rating: number, comment: string) => Promise<void>
    workerName: string
}

export function ReviewModal({ isOpen, onClose, onSubmit, workerName }: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a rating")
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await onSubmit(rating, comment)
            onClose()
            setRating(0)
            setComment("")
        } catch (err: any) {
            console.error("Error submitting review", err)
            // Show a generic error message or the specific one if available
            setError(err.message || "Failed to submit review. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Rate ${workerName}`}
        >
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-600">How was your experience?</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => { setRating(star); setError(null); }}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`h-8 w-8 ${star <= rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Write a review (optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share details about your experience..."
                        className="w-full min-h-[100px] rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
                        {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
