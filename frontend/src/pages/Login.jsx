import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  Box, Button, TextField, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Paper, Alert
} from '@mui/material';
import { MedicalServices } from '@mui/icons-material';

export default function Login() {
  const [form, setForm]   = useState({
    email: '', password: '', role: 'patient'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login }         = useAuth();
  const navigate          = useNavigate();

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      if (!form.email || !form.password || !form.role) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      const res = await API.post('/auth/login', form);
      login(res.data.user, res.data.token);

      const role = res.data.user.role;
      if (role === 'doctor')       navigate('/doctor');
      else if (role === 'admin')   navigate('/admin');
      else                         navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight:'100vh', display:'flex',
               alignItems:'center', justifyContent:'center',
               background:'linear-gradient(135deg, #e3f2fd, #f3e5f5)' }}>
      <Paper sx={{ p:4, width:420, borderRadius:3 }} elevation={4}>

        <Box sx={{ textAlign:'center', mb:3 }}>
          <MedicalServices sx={{ fontSize:44, color:'#1565c0' }} />
          <Typography variant="h5" fontWeight={800} color="#1565c0">
            MediConnect
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your account
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

        <TextField fullWidth label="Email Address" margin="normal"
          type="email" value={form.email}
          onChange={e => setForm({ ...form, email:e.target.value })}
          placeholder="your@email.com" />

        <TextField fullWidth label="Password" type="password" margin="normal"
          value={form.password}
          onChange={e => setForm({ ...form, password:e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter your password" />

        <FormControl fullWidth margin="normal">
          <InputLabel>Login As</InputLabel>
          <Select value={form.role} label="Login As"
            onChange={e => setForm({ ...form, role:e.target.value })}>
            <MenuItem value="patient">🧑‍🤝‍🧑 Patient</MenuItem>
            <MenuItem value="doctor">👨‍⚕️ Doctor</MenuItem>
            <MenuItem value="admin">🛡️ Admin</MenuItem>
          </Select>
        </FormControl>

        <Button fullWidth variant="contained" size="large"
          disabled={loading}
          sx={{ mt:3, borderRadius:2, py:1.5, fontWeight:700,
                background:'#1565c0',
                '&:hover': { background:'#0d47a1' } }}
          onClick={handleSubmit}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <Button fullWidth sx={{ mt:1, color:'#1565c0' }}
          onClick={() => navigate('/register')}>
          Don't have an account? Register
        </Button>

        <Button fullWidth sx={{ mt:0.5, color:'#666', fontSize:13 }}
          onClick={() => navigate('/')}>
          ← Back to Home
        </Button>
      </Paper>
    </Box>
  );
}