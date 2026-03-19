import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Commitments from './pages/Commitments';
import Meetings from './pages/Meetings';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Navbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/commitments" element={<Commitments />} />
              <Route path="/meetings" element={<Meetings />} />
            </Routes>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;