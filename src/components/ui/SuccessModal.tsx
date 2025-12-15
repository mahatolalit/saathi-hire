import { Modal } from "./Modal"
import { Button } from "./Button"
import { CheckCircle } from "lucide-react"

interface SuccessModalProps {
    isOpen: boolean
    onClose: () => void
    message?: string
}

export function SuccessModal({ isOpen, onClose, message = "Operation completed successfully!" }: SuccessModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center justify-center p-6 space-y-6">
                <div className="rounded-full bg-green-100 p-4 animate-in zoom-in duration-300">
                    <CheckCircle className="h-16 w-16 text-green-600 animate-bounce" />
                </div>
                <h3 className="text-xl font-semibold text-center text-gray-900">{message}</h3>
                <Button onClick={onClose} className="min-w-[120px] bg-green-600 hover:bg-green-700">
                    OK
                </Button>
            </div>
        </Modal>
    )
}
