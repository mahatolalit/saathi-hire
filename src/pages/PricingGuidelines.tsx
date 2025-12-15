import { Card, CardContent } from "../components/ui/Card"

const PRICING_DATA = [
    { category: "Plumber", task: "Tap Repair", price: "₹150 - ₹300" },
    { category: "Plumber", task: "Tank Cleaning", price: "₹500 - ₹1000" },
    { category: "Electrician", task: "Fan Installation", price: "₹200 - ₹400" },
    { category: "Electrician", task: "Switch Board Repair", price: "₹150 - ₹300" },
    { category: "Carpenter", task: "Door Lock Repair", price: "₹200 - ₹500" },
    { category: "Painter", task: "Single Room Paint", price: "₹2000 - ₹4000" },
    { category: "Maid", task: "Cleaning (1 BHK)", price: "₹1500 - ₹2500 / month" },
]

export default function PricingGuidelines() {
    return (
        <div className="container px-4 py-8 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Fair Pricing Guidelines</h1>
            <p className="text-gray-500 mb-8">
                These are estimated price ranges for common services in your city.
                Actual prices may vary based on work complexity.
            </p>

            <div className="grid gap-4">
                {PRICING_DATA.map((item, index) => (
                    <Card key={index}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">{item.task}</h3>
                                <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-primary-600">{item.price}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
