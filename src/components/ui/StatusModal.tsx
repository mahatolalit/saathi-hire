import { Modal } from "./Modal"
import { Button } from "./Button"
import { CheckCircle, XCircle } from "lucide-react"

interface StatusModalProps {
    isOpen: boolean
    onClose: () => void
    status: 'success' | 'error'
    title?: string
    message: string
}

export function StatusModal({ isOpen, onClose, status, title, message }: StatusModalProps) {
    const isSuccess = status === 'success'

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center justify-center p-6 space-y-6">
                <div className={`rounded-full p-4 animate-in zoom-in duration-300 ${isSuccess ? "bg-green-100" : "bg-red-100"
                    }`}>
                    {isSuccess ? (
                        <CheckCircle className="h-16 w-16 text-green-600 animate-bounce" />
                    ) : (
                        <XCircle className="h-16 w-16 text-red-600 animate-pulse" />
                    )}
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {title || (isSuccess ? "Success!" : "Error")}
                    </h3>
                    <p className="text-gray-600">{message}</p>
                </div>

                <Button
                    onClick={onClose}
                    className={`min-w-[120px] ${isSuccess
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                >
                    {isSuccess ? "OK" : "Try Again"}
                </Button>
            </div>
        </Modal>
    )
}
