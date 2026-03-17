import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Commitments from './pages/Commitments';
import Meetings from './pages/Meetings';

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/commitments" element={<Commitments />} />
        <Route path="/meetings" element={<Meetings />} />
      </Routes>
    </div>
  );
}

export default App;