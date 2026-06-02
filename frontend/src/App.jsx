import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';

const Protected = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/patient"  element={
        <Protected role="patient">
          <PatientDashboard />
        </Protected>
      } />
      <Route path="/doctor" element={
        <Protected role="doctor">
        <DoctorDashboard />
        </Protected>
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