import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { Layout } from "./components/layout/Layout"
import { PrivateRoute } from "./components/auth/PrivateRoute"
import { RequireProfile } from "./components/auth/RequireProfile"
import { RequireRole } from "./components/auth/RequireRole"
import Home from "./pages/Home"
import Signup from "./pages/Signup"
import Login from "./pages/Login"
import Onboarding from "./pages/Onboarding"
import Profile from "./pages/Profile"
import ProfileEdit from "./pages/ProfileEdit"
import { WorkerProfileView } from "./pages/WorkerProfileView"
import Search from "./pages/Search"
import PricingGuidelines from "./pages/PricingGuidelines"
import PostJob from "./pages/PostJob"
import FindJobs from "./pages/FindJobs"
import JobApplicants from "./pages/JobApplicants"
import Invites from "./pages/Invites"
import ScheduledJobs from "./pages/ScheduledJobs"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pricing" element={<PricingGuidelines />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />

              <Route element={<RequireProfile />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />

                {/* Shared Routes */}
                <Route path="/scheduled-jobs" element={<ScheduledJobs />} />

                {/* Citizen Only Routes */}
                <Route element={<RequireRole allowedRoles={['citizen']} />}>
                  <Route path="/search" element={<Search />} />
                  <Route path="/post-job" element={<PostJob />} />
                  <Route path="/worker/:id" element={<WorkerProfileView />} />
                  <Route path="/job/:jobId/applicants" element={<JobApplicants />} />
                </Route>

                {/* Worker Only Routes */}
                <Route element={<RequireRole allowedRoles={['worker']} />}>
                  <Route path="/jobs" element={<FindJobs />} />
                  <Route path="/invites" element={<Invites />} />
                </Route>
              </Route>
            </Route>
            {/* Placeholders for future routes */}
            <Route path="/join" element={<div className="p-8 text-center">Join Page (Coming Soon)</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
