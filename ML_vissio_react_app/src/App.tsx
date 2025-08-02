import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import AttendanceReport from './pages/AttendanceReport';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminProfile from './pages/admin/AdminProfile';
import AttendanceReview from './pages/admin/AttendanceReview';
import CreateUser from './pages/admin/CreateUser';
import ManageUsers from './pages/admin/ManageUsers';
import AddAttendance from './pages/admin/AddAttendance';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected User Routes */}
          <Route element={<PrivateRoute allowedRoles={['user']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/attendance-report" element={<AttendanceReport />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/attendance" element={<AttendanceReview />} />
            <Route path="/admin/add-attendance" element={<AddAttendance />} />
            <Route path="/admin/create-user" element={<CreateUser />} />
            <Route path="/admin/manage-users" element={<ManageUsers />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<AutoRedirect />} />
          <Route path="*" element={<AutoRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// ✅ Helper component to auto-redirect based on role
const AutoRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
};

export default App;
