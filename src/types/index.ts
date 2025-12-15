export interface UserProfile {
    $id?: string;
    uid?: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'citizen' | 'worker';
    pincode: string;
    phone?: string;
    phoneVerified?: boolean;
    verificationMethod?: 'Phone' | 'Email' | 'Government ID';
    createdAt: string;
}

export interface WorkerProfile extends UserProfile {
    category: string;
    experience: number; // in years
    languages: string[];
    serviceArea: string[]; // list of pincodes
    dailyRateMin?: number;
    dailyRateMax?: number;
    bio?: string;
    rating?: number;
    isAvailable?: boolean;
}

export const WORKER_CATEGORIES = [
    "Plumber",
    "Electrician",
    "Carpenter",
    "Painter",
    "Maid/Helper",
    "Driver",
    "Gardener",
    "Mason",
    "AC Repair",
    "Appliance Repair",
    "Tutor",
    "Other"
];

export interface Job {
    $id?: string; // Appwrite ID
    id?: string; // Legacy/Fallback
    title: string;
    description: string;
    category: string;
    budget: number; // Simplified for MVP
    location: string; // Pincode
    status: 'open' | 'closed';
    postedBy: string; // userId
    postedByName: string;
    createdAt: string;
    $createdAt: string;
}

export interface Application {
    $id?: string;
    jobId: string;
    workerId: string;
    status: 'pending' | 'accepted' | 'rejected';
    jobTitle: string;
    jobLocation: string;
    workerName: string;
    workerPhone: string;
    createdAt: string;
    $createdAt: string;
}

export interface Review {
    $id?: string;
    jobId: string;
    workerId: string;
    citizenId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface Invite {
    $id?: string;
    citizenId: string;
    citizenName: string;
    workerId: string;
    workType: string;
    customWorkType?: string;
    price: number;
    date: string;
    description?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    citizenPhone?: string;
    workerPhone?: string;
    createdAt: string;
}

// Force HMR update
