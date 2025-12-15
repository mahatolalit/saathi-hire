import { useState } from "react"
import { Button } from "./Button"
import { AlertTriangle } from "lucide-react"
import { Modal } from "./Modal"

export function SOSButton({ className }: { className?: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSOS = () => {
        // In a real app, this would send GPS coords to backend/SMS
        // For MVP, we simulate it
        setSent(true)
        setTimeout(() => {
            setSent(false)
            setIsOpen(false)
        }, 3000)
    }

    return (
        <>
            <Button
                variant="ghost"
                className={`text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 ${className}`}
                onClick={() => setIsOpen(true)}
            >
                <AlertTriangle className="h-4 w-4" />
                <span className="font-semibold">SOS</span>
            </Button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="EMERGENCY SOS">
                <div className="text-center space-y-4 text-gray-900">
                    <div className="p-4 bg-red-100 rounded-full inline-block">
                        <AlertTriangle className="h-12 w-12 text-red-600" />
                    </div>
                    <p className="text-lg font-medium">
                        Are you in danger? This will send your location to emergency contacts.
                    </p>
                    {sent ? (
                        <div className="p-4 bg-green-100 text-green-800 rounded-md">
                            Alert Sent! Help is on the way.
                        </div>
                    ) : (
                        <Button variant="destructive" size="lg" className="w-full" onClick={handleSOS}>
                            SEND ALERT NOW
                        </Button>
                    )}
                </div>
            </Modal>
        </>
    )
}
