import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import Chatbot from './components/Chatbot';
import UserManagement from './components/UserManagement';

import { getLoggedInUser } from './utils/storage';

// Role-based wrapper
const LandingRoute = () => {
  const email = getLoggedInUser();
  const role = JSON.parse(localStorage.getItem('user:' + email))?.role;

  if (role === 'driver') return <DriverDashboard />;
  if (role === 'admin') return <UserManagement />;
  return <LandingPage />;
};


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="/chat" element={<Chatbot />} /> */}
        <Route path="/landing" element={<LandingRoute />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/manageusers" element={<UserManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
