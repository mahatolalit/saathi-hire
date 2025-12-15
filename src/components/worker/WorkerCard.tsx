import { Link } from "react-router-dom"
import { type WorkerProfile } from "../../types"
import { Button } from "../ui/Button"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/Card"
import { Badge } from "../ui/Badge"
import { MapPin, Star, Phone, CheckCircle, AlertCircle } from "lucide-react"

export function WorkerCard({ worker }: { worker: WorkerProfile }) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4 flex flex-row gap-4 items-start">
                <img
                    src={worker.photoURL || "https://via.placeholder.com/100"}
                    alt={worker.displayName || "Worker"}
                    className="w-16 h-16 rounded-full object-cover border"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-semibold text-lg truncate">{worker.displayName}</h3>
                            {worker.phoneVerified || worker.verificationMethod ? (
                                <Badge variant="secondary" className="w-fit bg-green-100 text-green-800 hover:bg-green-100 border-green-200 gap-1 text-[10px] px-2 py-0 h-5">
                                    <CheckCircle className="h-3 w-3" />
                                    Verified {worker.verificationMethod || "Phone"}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 gap-1 text-[10px] px-2 py-0 h-5">
                                    <AlertCircle className="h-3 w-3" />
                                    Unverified
                                </Badge>
                            )}
                        </div>
                        {worker.rating && (
                            <div className="flex items-center gap-1 text-yellow-500 text-sm">
                                <Star className="h-3 w-3 fill-current" />
                                <span>{worker.rating}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-orange-600 text-sm font-medium">{worker.category}</p>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{worker.pincode}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-gray-600 line-clamp-2">
                {worker.bio || "No bio available."}
            </CardContent>
            <CardFooter className="p-4 bg-gray-50 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                    <Link to={`/worker/${worker.$id || worker.uid}`}>View Profile</Link>
                </Button>
                <Button size="sm" className="flex-1 gap-1" onClick={() => window.open(`tel:${"1234567890"}`)}>
                    <Phone className="h-3 w-3" /> Call
                </Button>
            </CardFooter>
        </Card>
    )
}
