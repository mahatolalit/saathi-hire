# Saathi Hire - Hyperlocal Worker Connect Platform

Saathi-Hire is a community-driven platform designed to connect local workers (plumbers, electricians, maids, etc.) with citizens in their neighborhood. It operates on a **no-commission** model, fostering direct connections and building trust through community verification.

## 🚀 Features

*   **Worker Profiles:** Workers can create detailed profiles with their skills, experience, languages, and service area (pincode).
*   **Hyperlocal Search:** Citizens can find workers nearby based on pincode and work category.
*   **Direct Connection:** Call or WhatsApp workers directly without intermediaries.
*   **Community Verification:** Ratings, reviews, and "Verified by Neighbors" badges build trust.
*   **Job Posting:** Users can post jobs, and workers can apply directly.
*   **Safety First:** SOS button for emergency situations.

## 🛠️ Tech Stack

**Frontend:**
*   [React 19](https://react.dev/)
*   [Vite](https://vitejs.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [React Router DOM](https://reactrouter.com/)
*   [React Hook Form](https://react-hook-form.com/)
*   [Lucide React](https://lucide.dev/) (Icons)

**Backend:**
*   [Appwrite](https://appwrite.io/) (Auth, Database, Functions, Storage)

## 📂 Project Structure

```
saathi-hire/
├── src/                # Frontend source code
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and Appwrite config
│   ├── pages/          # Application pages
│   └── types/          # TypeScript type definitions
├── backend/            # Appwrite backend configuration
│   ├── functions/      # Appwrite Cloud Functions
│   └── scripts/        # Backend management scripts
├── public/             # Static assets
└── ...config files
```

## ⚡ Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   Appwrite Account (Cloud or Self-hosted)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/saathi-hire.git
    cd saathi-hire
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and add your Appwrite credentials:
    ```env
    VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
    VITE_APPWRITE_PROJECT_ID=your_project_id
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

## 🔙 Backend Setup (Appwrite)

The backend logic and configuration are located in the `backend/` directory. This folder is excluded from git by default to keep secrets safe and allow for local management.

To deploy Appwrite functions:

1.  **Navigate to the backend folder:**
    ```bash
    cd backend
    ```

2.  **Install Appwrite CLI (if not installed):**
    ```bash
    npm install -g appwrite-cli
    ```

3.  **Login and Deploy:**
    ```bash
    appwrite login
    appwrite deploy function
    ```

See `workflows/deploy_appwrite_function.md` for detailed deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
