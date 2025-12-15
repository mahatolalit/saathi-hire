import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { Query } from "appwrite"
import { type WorkerProfile, WORKER_CATEGORIES } from "../types"
import { WorkerCard } from "../components/worker/WorkerCard"
import { Button } from "../components/ui/Button"
import { Search as SearchIcon } from "lucide-react"
import { AddressSearch } from "../components/ui/AddressSearch"

export default function Search() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [workers, setWorkers] = useState<WorkerProfile[]>([])
    const [loading, setLoading] = useState(false)

    const initialPincode = searchParams.get("pincode") || ""
    const initialCategory = searchParams.get("category") || ""

    const [pincode, setPincode] = useState(initialPincode)
    const [category, setCategory] = useState(initialCategory)

    const handleSearch = async () => {
        setLoading(true)
        setSearchParams({ pincode, category })

        try {
            let workerDocs: any[] = []
            let userDocs: any[] = []

            if (category) {
                // 1. Filter by Category (Workers Collection)
                const wResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_WORKERS,
                    [Query.equal("category", category)]
                )
                workerDocs = wResponse.documents

                if (workerDocs.length === 0) {
                    setWorkers([])
                    return
                }

                const workerIds = workerDocs.map(d => d.$id)

                // 2. Fetch Users (and filter by Pincode if needed)
                const uQueries = [Query.equal('$id', workerIds)]
                if (pincode) {
                    uQueries.push(Query.equal("pincode", pincode))
                }

                const uResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_USERS,
                    uQueries
                )
                userDocs = uResponse.documents

            } else if (pincode) {
                // 1. Filter by Pincode (Users Collection)
                const uResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_USERS,
                    [
                        Query.equal("pincode", pincode),
                        Query.equal("role", "worker")
                    ]
                )
                userDocs = uResponse.documents

                if (userDocs.length === 0) {
                    setWorkers([])
                    return
                }

                const userIds = userDocs.map(d => d.$id)

                // 2. Fetch Workers
                const wResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_WORKERS,
                    [Query.equal('$id', userIds)]
                )
                workerDocs = wResponse.documents

            } else {
                // No filters - List all workers
                const wResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_WORKERS,
                    []
                )
                workerDocs = wResponse.documents

                if (workerDocs.length === 0) {
                    setWorkers([])
                    return
                }

                const workerIds = workerDocs.map(d => d.$id)

                const uResponse = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTION_USERS,
                    [Query.equal('$id', workerIds)]
                )
                userDocs = uResponse.documents
            }

            // Merge Data
            const merged = userDocs.map(u => {
                const w = workerDocs.find(wd => wd.$id === u.$id)
                if (!w) return null
                return { ...u, ...w }
            }).filter(Boolean)

            setWorkers(merged as unknown as WorkerProfile[])

        } catch (error) {
            console.error("Error searching workers", error)
            setWorkers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        handleSearch()
    }, [])

    return (
        <div className="container px-4 py-8">
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-start">
                <div className="w-full md:w-64">
                    <AddressSearch onPincodeSelect={setPincode} />
                    <div className="mt-1 text-xs text-gray-400">Pincode: {pincode}</div>
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full md:w-64 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950"
                >
                    <option value="">All Categories</option>
                    {WORKER_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <Button onClick={handleSearch} disabled={loading} className="gap-2">
                    <SearchIcon className="h-4 w-4" /> Search
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : workers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map(worker => (
                        <WorkerCard key={worker.$id || worker.uid} worker={worker} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No workers found. Try different filters.
                </div>
            )}
        </div>
    )
}
