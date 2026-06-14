/*import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage      from './pages/LandingPage';

import Login            from './pages/Login';
import Register         from './pages/Register';

import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard  from './pages/DoctorDashboard';
import AdminDashboard   from './pages/AdminDashboard';

import VideoRoom        from './pages/VideoRoom';

const Protected = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/video-room" element={<VideoRoom />} />
      <Route path="/patient" element={
        <Protected role="patient"><PatientDashboard /></Protected>
      } />
      <Route path="/doctor" element={
        <Protected role="doctor"><DoctorDashboard /></Protected>
      } />
      <Route path="/admin" element={
        <Protected role="admin"><AdminDashboard /></Protected>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
*/
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login            from './pages/Login';
import Register         from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard  from './pages/DoctorDashboard';
import AdminDashboard   from './pages/AdminDashboard';
import VideoRoom        from './pages/VideoRoom';
import LandingPage      from './pages/LandingPage';

const Protected = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/video-room" element={<VideoRoom />} />
      <Route path="/patient"  element={
        <Protected role="patient"><PatientDashboard /></Protected>
      } />
      <Route path="/doctor"   element={
        <Protected role="doctor"><DoctorDashboard /></Protected>
      } />
      <Route path="/admin"    element={
        <Protected role="admin"><AdminDashboard /></Protected>
      } />
      <Route path="*"         element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}