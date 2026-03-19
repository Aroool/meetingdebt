import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Commitments from './pages/Commitments';
import Meetings from './pages/Meetings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
      </Routes>
    </div>
  );
}

export default App;