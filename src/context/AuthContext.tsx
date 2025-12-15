import React, { createContext, useContext, useEffect, useState } from "react"
import { account, databases, APPWRITE_CONFIG } from "../lib/appwrite"
import { type Models, ID } from "appwrite"
import { type UserProfile } from "../types"

interface AuthContextType {
    user: Models.User<Models.Preferences> | null
    userProfile: UserProfile | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, name: string) => Promise<void>
    logout: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        try {
            const currentUser = await account.get()
            setUser(currentUser)
            await fetchUserProfile(currentUser.$id)
        } catch (error) {
            setUser(null)
            setUserProfile(null)
        } finally {
            setLoading(false)
        }
    }

    const fetchUserProfile = async (userId: string) => {
        try {
            const response = await databases.getDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTION_USERS,
                userId
            )
            let profile = response as unknown as UserProfile

            if (profile.role === 'worker') {
                try {
                    const workerDoc = await databases.getDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_WORKERS,
                        userId
                    )
                    profile = { ...profile, ...workerDoc }
                } catch (e) {
                    console.log("Worker profile not found")
                }
            }

            // Ensure phone fields are present (defaults if missing in DB)
            profile = {
                ...profile,
                phone: profile.phone || undefined,
                phoneVerified: profile.phoneVerified || false
            }

            // Sync with Appwrite Account Status
            // If Appwrite Account says verified, but DB says not, update DB
            try {
                const accountUser = await account.get()
                if (accountUser.phoneVerification && !profile.phoneVerified) {
                    console.log("Syncing phone verification status to DB...")
                    await databases.updateDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_USERS,
                        userId,
                        {
                            phoneVerified: true,
                            phone: accountUser.phone // Also sync number if available
                        }
                    )
                    profile.phoneVerified = true
                    profile.phone = accountUser.phone
                } else if (accountUser.phone && !profile.phone) {
                    // Sync phone number if missing in DB
                    await databases.updateDocument(
                        APPWRITE_CONFIG.DATABASE_ID,
                        APPWRITE_CONFIG.COLLECTION_USERS,
                        userId,
                        {
                            phone: accountUser.phone
                        }
                    )
                    profile.phone = accountUser.phone
                }
            } catch (err) {
                console.error("Error syncing account status", err)
            }

            setUserProfile(profile)
        } catch (error) {
            console.log("No user profile found")
            setUserProfile(null)
        }
    }

    const login = async (email: string, password: string) => {
        await account.createEmailPasswordSession(email, password)
        await checkUser()
    }

    const signup = async (email: string, password: string, name: string) => {
        await account.create(ID.unique(), email, password, name)
        await login(email, password)
    }

    const logout = async () => {
        await account.deleteSession('current')
        setUser(null)
        setUserProfile(null)
    }

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.$id)
        }
    }

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, login, signup, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
