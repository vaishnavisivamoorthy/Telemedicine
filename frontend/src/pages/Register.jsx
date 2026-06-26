import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Box, Button, TextField, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Paper, Alert, Chip
} from '@mui/material';
import { MedicalServices } from '@mui/icons-material';

export default function Register() {
  const [form, setForm]   = useState({
    name: '', email: '', password: '', role: 'patient'
  });
  const [msg, setMsg]     = useState('');
  const [error, setError] = useState('');
  const navigate          = useNavigate();

  const handleSubmit = async () => {
    try {
      setError('');
      if (!form.name || !form.email || !form.password) {
        setError('All fields are required');
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      await API.post('/auth/register', form);
      setMsg('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Box sx={{ minHeight:'100vh', display:'flex',
               alignItems:'center', justifyContent:'center',
               background:'linear-gradient(135deg, #e3f2fd, #f3e5f5)' }}>
      <Paper sx={{ p:4, width:420, borderRadius:3 }} elevation={4}>

        {/* Header */}
        <Box sx={{ textAlign:'center', mb:3 }}>
          <MedicalServices sx={{ fontSize:44, color:'#1565c0' }} />
          <Typography variant="h5" fontWeight={800} color="#1565c0">
            MediConnect
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your account
          </Typography>
        </Box>

        {msg   && <Alert severity="success" sx={{ mb:2 }}>{msg}</Alert>}
        {error && <Alert severity="error"   sx={{ mb:2 }}>{error}</Alert>}

        <TextField fullWidth label="Full Name" margin="normal"
          value={form.name}
          onChange={e => setForm({ ...form, name:e.target.value })}
          placeholder="Enter your full name" />

        <TextField fullWidth label="Email Address" margin="normal"
          type="email" value={form.email}
          onChange={e => setForm({ ...form, email:e.target.value })}
          placeholder="your@email.com" />

        <TextField fullWidth label="Password" type="password" margin="normal"
          value={form.password}
          onChange={e => setForm({ ...form, password:e.target.value })}
          placeholder="Minimum 6 characters" />

        <FormControl fullWidth margin="normal">
          <InputLabel>Register As</InputLabel>
          <Select value={form.role} label="Register As"
            onChange={e => setForm({ ...form, role:e.target.value })}>
            <MenuItem value="patient">🧑‍🤝‍🧑 Patient</MenuItem>
            <MenuItem value="doctor">👨‍⚕️ Doctor</MenuItem>
            <MenuItem value="admin">🛡️ Admin</MenuItem>
          </Select>
        </FormControl>

        {form.role === 'admin' && (
          <Alert severity="warning" sx={{ mt:1 }}>
            Admin accounts require approval from system administrator.
          </Alert>
        )}

        <Button fullWidth variant="contained" size="large"
          sx={{ mt:3, borderRadius:2, py:1.5, fontWeight:700,
                background:'#1565c0',
                '&:hover': { background:'#0d47a1' } }}
          onClick={handleSubmit}>
          Create Account
        </Button>

        <Button fullWidth sx={{ mt:1, color:'#1565c0' }}
          onClick={() => navigate('/login')}>
          Already have an account? Sign In
        </Button>
      </Paper>
    </Box>
  );
}