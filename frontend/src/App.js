import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Commitments from './pages/Commitments';
import Meetings from './pages/Meetings';
import Workspace from './pages/Workspace';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import CreateWorkspace from './pages/CreateWorkspace';
import AcceptInvite from './pages/AcceptInvite';
import JoinOrCreate from './pages/JoinOrCreate';
import EnterInvite from './pages/EnterInvite';
import Profile from './pages/Profile';
import ThemePicker from './pages/ThemePicker';
import { useEffect, useState } from 'react';
import MyTasks from './pages/MyTasks';
import Feedback from './pages/Feedback';
import Transcripts from './pages/Transcripts';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Layout wrapper for all authenticated pages.
// Desktop: sidebar 52px left + topbar 52px top.
// Mobile: no left margin, bottom nav 64px.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return isMobile;
}

function ProtectedLayout({ children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      marginLeft: isMobile ? 0 : 52,
      paddingTop: 52,
      paddingBottom: isMobile ? 72 : 0,
      minHeight: '100vh',
    }}>
      {children}
    </div>
  );
}

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.body.classList.add('dark');
  }, []);

  return (
    <div className="app">
      <Routes>
        {/* Public routes — no navbar */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/theme-picker" element={<ProtectedRoute><ThemePicker /></ProtectedRoute>} />

        {/* Auth-gated routes without nav (workspace setup flows) */}
        <Route path="/create-workspace" element={
          <ProtectedRoute>
            <CreateWorkspace />
          </ProtectedRoute>
        } />
        <Route path="/join-or-create" element={
          <ProtectedRoute>
            <JoinOrCreate />
          </ProtectedRoute>
        } />
        <Route path="/enter-invite" element={
          <ProtectedRoute>
            <EnterInvite />
          </ProtectedRoute>
        } />

        {/* Protected app routes — sidebar + top bar layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
        <Route path="/commitments" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <Commitments />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
        <Route path="/meetings" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <Meetings />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
        <Route path="/workspace" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <Workspace />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <Profile />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
        <Route path="/my-tasks" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <MyTasks />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <Feedback />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
        <Route path="/transcripts" element={
          <ProtectedRoute>
            <Navbar />
            <ProtectedLayout>
              <Transcripts />
            </ProtectedLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
