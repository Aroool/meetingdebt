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

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/create-workspace" element={
          <ProtectedRoute>
            <CreateWorkspace />
          </ProtectedRoute>
        } />
        <Route path="/workspace" element={
          <ProtectedRoute>
            <Navbar />
            <Workspace />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navbar />
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/commitments" element={
          <ProtectedRoute>
            <Navbar />
            <Commitments />
          </ProtectedRoute>
        } />
        <Route path="/meetings" element={
          <ProtectedRoute>
            <Navbar />
            <Meetings />
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
      </Routes>
    </div>
  );
}

export default App;