import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Box, Button, TextField, Typography,
  Select, MenuItem, FormControl, InputLabel,
  Paper, Alert
} from '@mui/material';

export default function Register() {
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'patient' });
  const [msg, setMsg]     = useState('');
  const [error, setError] = useState('');
  const navigate          = useNavigate();

  const handleSubmit = async () => {
    try {
      await API.post('/auth/register', form);
      setMsg('Registered! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex',
               alignItems: 'center', justifyContent: 'center',
               background: '#f0f4f8' }}>
      <Paper sx={{ p: 4, width: 400, borderRadius: 3 }} elevation={3}>
        <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
          🏥 Create Account
        </Typography>

        {msg   && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
        {error && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}

        <TextField fullWidth label="Full Name" margin="normal"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />

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
          Register
        </Button>

        <Button fullWidth sx={{ mt: 1 }}
          onClick={() => navigate('/')}>
          Already have an account? Login
        </Button>
      </Paper>
    </Box>
  );
}