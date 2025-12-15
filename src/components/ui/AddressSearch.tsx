import { useState, useEffect } from "react"
import { Input } from "../ui/Input"
import { MapPin } from "lucide-react"

interface AddressSearchProps {
    onPincodeSelect: (pincode: string) => void
}

export function AddressSearch({ onPincodeSelect }: AddressSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 3) {
                setLoading(true)
                try {
                    // Use OpenStreetMap Nominatim API
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", India")}&addressdetails=1&limit=5`
                    )
                    const data = await response.json()
                    setResults(data)
                    setShowResults(true)
                } catch (error) {
                    console.error("Error fetching address", error)
                } finally {
                    setLoading(false)
                }
            } else {
                setResults([])
                setShowResults(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [query])

    const handleSelect = (item: any) => {
        const pincode = item.address?.postcode
        if (pincode) {
            onPincodeSelect(pincode)
            setQuery(item.display_name)
            setShowResults(false)
        } else {
            alert("Selected location doesn't have a pincode. Please try a more specific address.")
        }
    }

    return (
        <div className="relative w-full">
            <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    className="pl-9"
                    placeholder="Search by Address, Colony, or Landmark..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {loading && (
                    <div className="absolute right-3 top-3">
                        <div className="animate-spin h-4 w-4 border-2 border-primary-600 rounded-full border-t-transparent"></div>
                    </div>
                )}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((item) => (
                        <button
                            key={item.place_id}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b last:border-0"
                            onClick={() => handleSelect(item)}
                        >
                            <p className="font-medium truncate">{item.display_name.split(",")[0]}</p>
                            <p className="text-xs text-gray-500 truncate">{item.display_name}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
