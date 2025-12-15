import { useState } from "react"
import { Button } from "../components/ui/Button"
import { Search as SearchIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { WORKER_CATEGORIES } from "../types"
import { AddressSearch } from "../components/ui/AddressSearch"
import { useAuth } from "../context/AuthContext"
import FindJobs from "./FindJobs"
import Search from "./Search"

export default function Home() {
    const { user, userProfile } = useAuth()
    const navigate = useNavigate()
    const [pincode, setPincode] = useState("")
    const [category, setCategory] = useState("")

    // Role-based Homepage
    if (user && userProfile) {
        if (userProfile.role === 'worker') {
            return <FindJobs />
        }
    }

    // Landing Page (Public)
    const handleSearch = () => {
        const params = new URLSearchParams()
        if (pincode) params.append("pincode", pincode)
        if (category) params.append("category", category)
        navigate(`/search?${params.toString()}`)
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-900">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: `url('/src/assets/heroimg.jpg')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                <div className="container mx-auto relative z-10 px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                                Find Trusted Local Workers
                            </h1>
                            <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                                Connect directly with plumbers, electricians, and more in your neighbourhood.
                                <br className="hidden md:inline" /> No commissions. No middlemen.
                            </p>
                        </div>

                        <div className="w-full max-w-2xl space-y-4 bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-xl mt-8">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <AddressSearch onPincodeSelect={setPincode} />
                                    {pincode && (
                                        <div className="mt-1 text-xs text-gray-500 text-left pl-1">
                                            Selected Pincode: {pincode}
                                        </div>
                                    )}
                                </div>
                                <select
                                    className="flex h-10 w-full md:w-48 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="">Select Category</option>
                                    {WORKER_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <Button size="lg" className="w-full h-12 text-lg gap-2 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSearch}>
                                <SearchIcon className="h-5 w-5" /> Find Workers
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full py-8 md:py-16 lg:py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
                            Why Choose SaathiConnect?
                        </h2>
                        <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl">
                            Empowering local communities with direct, trusted connections.
                        </p>
                    </div>
                    <div className="grid gap-6 lg:gap-10 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Hyperlocal Feature */}
                        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 lg:p-8 shadow-sm transition-shadow hover:shadow-md">
                            <div
                                className="absolute inset-0 z-0 opacity-[0.32] transition-opacity group-hover:opacity-[0.42]"
                                style={{
                                    backgroundImage: `url('/src/assets/hyperlocal.png')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-orange-300 rounded-full text-orange-600">
                                    <span className="text-3xl">📍</span>
                                </div>
                                <h3 className="text-xl font-bold">Hyperlocal</h3>
                                <p className="text-gray-500">Find workers within your specific pincode area.</p>
                            </div>
                        </div>

                        {/* Direct Connect Feature */}
                        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 lg:p-8 shadow-sm transition-shadow hover:shadow-md">
                            <div
                                className="absolute inset-0 z-0 opacity-[0.32] transition-opacity group-hover:opacity-[0.42]"
                                style={{
                                    backgroundImage: `url('/src/assets/directconnect.png')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-orange-300 rounded-full text-orange-600">
                                    <span className="text-3xl">🤝</span>
                                </div>
                                <h3 className="text-xl font-bold">Direct Connect</h3>
                                <p className="text-gray-500">Call or WhatsApp directly. No app commissions.</p>
                            </div>
                        </div>

                        {/* Community Verified Feature */}
                        <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 lg:p-8 shadow-sm transition-shadow hover:shadow-md">
                            <div
                                className="absolute inset-0 z-0 opacity-[0.32] transition-opacity group-hover:opacity-[0.42]"
                                style={{
                                    backgroundImage: `url('/src/assets/communityverified.png')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                <div className="p-4 bg-orange-300 rounded-full text-orange-600">
                                    <span className="text-3xl">🛡️</span>
                                </div>
                                <h3 className="text-xl font-bold">Community Verified</h3>
                                <p className="text-gray-500">Trusted by your neighbours with real reviews.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
