import { Outlet } from "react-router-dom"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"
import { MobileNav } from "./MobileNav"

export function Layout() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">
                <Outlet />
            </main>
            <Footer />
            <MobileNav />
        </div>
    )
}
