import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Parking from './pages/Parking';
import ParkingDetails from './pages/ParkingDetails';
import Dashboard from './pages/Dashboard';
import Ticket from './pages/Ticket';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Admin Pages
import AdminLots from './pages/admin/AdminLots';
import AdminSlots from './pages/admin/AdminSlots';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="relative min-h-screen font-body text-on-surface">
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#1A1A1E',
            color: '#E2E2E8',
            border: '1px solid rgba(226, 226, 232, 0.1)',
            borderRadius: '1rem',
          }
        }} />
        <Navbar />

        <main className="p-6">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/parking" element={<Parking />} />
            <Route path="/parking/:id" element={<ParkingDetails />} />

            {/* Protected Routes — requires login */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ticket/:id" element={<Ticket />} />
            </Route>

            {/* Admin Routes — requires login + role: admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/lots" element={<AdminLots />} />
              <Route path="/admin/lots/:id" element={<AdminSlots />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
