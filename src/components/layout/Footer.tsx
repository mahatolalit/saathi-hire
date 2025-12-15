import { Heart } from "lucide-react"
import { SOSButton } from "../ui/SOSButton"

export function Footer() {
    return (
        <footer className="bg-[#1e3a8a] text-white">
            <div className="container px-4 py-8 md:px-6">
                <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="text-center md:text-left">
                        <p className="text-sm font-medium">
                            © 2025 SaathiHire. All rights reserved.
                        </p>
                        <p className="text-xs text-blue-200 mt-1">
                            An initiative for connecting citizens and workers.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <SOSButton className="text-white hover:text-white hover:bg-blue-800" />
                        <div className="flex items-center gap-1 text-sm text-blue-200">
                            Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> in India
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
