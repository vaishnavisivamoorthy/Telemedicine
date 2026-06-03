import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Box, Typography, Button, Paper, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Avatar, Divider, Card, CardContent
} from '@mui/material';
import {
  CalendarMonth, VideoCall, MedicalServices,
  Logout, Person, AccessTime, CheckCircle, Cancel
} from '@mui/icons-material';

export default function PatientDashboard() {
  const { user, logout }            = useAuth();
  const navigate                    = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors]       = useState([]);
  const [openBook, setOpenBook]     = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [form, setForm]             = useState({
    doctorId: '', startTime: '', endTime: '', timezone: 'Asia/Kolkata'
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await API.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await API.get('/patients');
      setDoctors(res.data.filter(u => u.role === 'doctor'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async () => {
    try {
      setError('');
      await API.post('/appointments', form);
      setSuccess('Appointment booked successfully!');
      setOpenBook(false);
      fetchAppointments();
      setForm({ doctorId: '', startTime: '', endTime: '', timezone: 'Asia/Kolkata' });
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.patch(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const statusColor = (s) =>
    s === 'confirmed' ? 'success' :
    s === 'cancelled' ? 'error'   :
    s === 'completed' ? 'info'    : 'warning';

  return (
    <Box sx={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Top Navbar */}
      <Box sx={{ background: '#1565c0', color: 'white',
                 px: 4, py: 2, display: 'flex',
                 justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MedicalServices />
          <Typography variant="h6" fontWeight={700}>
            Telemedicine Portal
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#42a5f5', width: 36, height: 36 }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography>{user?.name}</Typography>
          <Button color="inherit" startIcon={<Logout />}
            onClick={handleLogout}>Logout</Button>
        </Box>
      </Box>

      <Box sx={{ p: 4 }}>

        {/* Welcome Banner */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3,
                     background: 'linear-gradient(135deg, #1565c0, #42a5f5)',
                     color: 'white' }}>
          <Typography variant="h5" fontWeight={700}>
            Welcome back, {user?.name}! 👋
          </Typography>
          <Typography sx={{ mt: 1, opacity: 0.9 }}>
            Manage your appointments and health records from one place.
          </Typography>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={3}>
          {[
            { label: 'Total Appointments', value: appointments.length,
              icon: <CalendarMonth sx={{ fontSize: 40, color: '#1565c0' }} />,
              color: '#e3f2fd' },
            { label: 'Upcoming',
              value: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
              icon: <AccessTime sx={{ fontSize: 40, color: '#2e7d32' }} />,
              color: '#e8f5e9' },
            { label: 'Completed',
              value: appointments.filter(a => a.status === 'completed').length,
              icon: <CheckCircle sx={{ fontSize: 40, color: '#f57c00' }} />,
              color: '#fff3e0' },
            { label: 'Cancelled',
              value: appointments.filter(a => a.status === 'cancelled').length,
              icon: <Cancel sx={{ fontSize: 40, color: '#c62828' }} />,
              color: '#ffebee' },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ borderRadius: 3, background: stat.color }}>
                <CardContent sx={{ display: 'flex',
                                   justifyContent: 'space-between',
                                   alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                  {stat.icon}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Alerts */}
        {success && <Alert severity="success" sx={{ mb: 2 }}
          onClose={() => setSuccess('')}>{success}</Alert>}
        {error   && <Alert severity="error"   sx={{ mb: 2 }}
          onClose={() => setError('')}>{error}</Alert>}

        {/* Appointments Section */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between',
                     alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              📅 My Appointments
            </Typography>
            <Button variant="contained" startIcon={<CalendarMonth />}
              onClick={() => setOpenBook(true)}
              sx={{ borderRadius: 2 }}>
              Book Appointment
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {appointments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <CalendarMonth sx={{ fontSize: 60, opacity: 0.3 }} />
              <Typography mt={2}>No appointments yet. Book your first one!</Typography>
            </Box>
          ) : (
            appointments.map((appt) => (
              <Paper key={appt._id} variant="outlined"
                sx={{ p: 2, mb: 2, borderRadius: 2,
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" color="primary" />
                    <Typography fontWeight={600}>
                      {appt.doctorId?.name || 'Unknown'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    🕐 {new Date(appt.startTime).toLocaleString()} —{' '}
                    {new Date(appt.endTime).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🌍 {appt.timezone}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={appt.status} size="small"
                    color={statusColor(appt.status)} />
                  {(appt.status === 'confirmed' || appt.status === 'pending') && (
                    <>
                      <Button size="small" variant="outlined"
                        startIcon={<VideoCall />}
                        onClick={() => navigate('/video-room')}
                        sx={{ borderRadius: 2 }}>
                        Join Call
                      </Button>
                      <Button size="small" variant="outlined"
                        color="error" startIcon={<Cancel />}
                        onClick={() => handleCancel(appt._id)}
                        sx={{ borderRadius: 2 }}>
                        Cancel
                      </Button>
                    </>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Paper>
      </Box>

      {/* Book Appointment Dialog */}
      <Dialog open={openBook} onClose={() => setOpenBook(false)}
        maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>📅 Book New Appointment</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField select fullWidth label="Select Doctor" margin="normal"
            value={form.doctorId}
            onChange={e => setForm({ ...form, doctorId: e.target.value })}
            SelectProps={{ native: true }}>
            <option value="">-- Choose a Doctor --</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>Dr. {d.name}</option>
            ))}
          </TextField>

          <TextField fullWidth label="Start Time" type="datetime-local"
            margin="normal" InputLabelProps={{ shrink: true }}
            value={form.startTime}
            onChange={e => setForm({ ...form, startTime: e.target.value })} />

          <TextField fullWidth label="End Time" type="datetime-local"
            margin="normal" InputLabelProps={{ shrink: true }}
            value={form.endTime}
            onChange={e => setForm({ ...form, endTime: e.target.value })} />

          <TextField fullWidth label="Timezone" margin="normal"
            value={form.timezone}
            onChange={e => setForm({ ...form, timezone: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setOpenBook(false); setError(''); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleBook}
            sx={{ borderRadius: 2 }}>
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}