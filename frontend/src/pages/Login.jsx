import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  Box, Button, TextField, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Paper, Alert
} from '@mui/material';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '', role: 'patient' });
  const [error, setError]   = useState('');
  const { login }           = useAuth();
  const navigate            = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await API.post('/auth/login', form);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'doctor')  navigate('/doctor');
      else if (res.data.user.role === 'admin') navigate('/admin');
      else navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex',
               alignItems: 'center', justifyContent: 'center',
               background: '#f0f4f8' }}>
      <Paper sx={{ p: 4, width: 400, borderRadius: 3 }} elevation={3}>
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          🏥 Telemedicine Login
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField fullWidth label="Email" margin="normal"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />

        <TextField fullWidth label="Password" type="password" margin="normal"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} />

        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select value={form.role} label="Role"
            onChange={e => setForm({ ...form, role: e.target.value })}>
            <MenuItem value="patient">Patient</MenuItem>
            <MenuItem value="doctor">Doctor</MenuItem>
          </Select>
        </FormControl>

        <Button fullWidth variant="contained" size="large"
          sx={{ mt: 2, borderRadius: 2, py: 1.5 }}
          onClick={handleSubmit}>
          Login
        </Button>

        <Button fullWidth sx={{ mt: 1 }}
          onClick={() => navigate('/register')}>
          Don't have an account? Register
        </Button>
      </Paper>
    </Box>
  );
}