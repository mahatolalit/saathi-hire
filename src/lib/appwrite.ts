import { Client, Account, Databases, Storage } from 'appwrite';

export const client = new Client();

const endpoint = import.meta.env.VITE_APPWRITE_API_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

console.log("Appwrite Config Debug:", { endpoint, projectId });

client
    .setEndpoint(endpoint)
    .setProject(projectId || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
    DATABASE_ID: 'saathi-db',
    COLLECTION_USERS: 'users',
    COLLECTION_WORKERS: 'workers',
    COLLECTION_JOBS: 'jobs',
    COLLECTION_POSTS: 'posts',
    COLLECTION_REVIEWS: 'reviews',
    BUCKET_ID: 'saathi-storage'
};
