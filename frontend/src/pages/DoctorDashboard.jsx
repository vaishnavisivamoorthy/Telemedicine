import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Box, Typography, Button, Paper, Grid, Chip,
  Avatar, Divider, Card, CardContent, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField
} from '@mui/material';
import {
  VideoCall, MedicalServices, Logout, Person,
  AccessTime, CheckCircle, CalendarMonth,
  NoteAdd, People
} from '@mui/icons-material';

export default function DoctorDashboard() {
  const { user, logout }                = useAuth();
  const navigate                        = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [success, setSuccess]           = useState('');
  const [error, setError]               = useState('');
  const [openNote, setOpenNote]         = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [note, setNote]                 = useState('');

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await API.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await API.patch(`/appointments/${id}/confirm`);
      setSuccess('Appointment confirmed!');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm');
    }
  };

  const handleComplete = async (id) => {
    try {
      await API.patch(`/appointments/${id}/complete`);
      setSuccess('Appointment marked as completed!');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleSaveNote = () => {
    setSuccess(`Note saved for appointment!`);
    setOpenNote(false);
    setNote('');
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const statusColor = (s) =>
    s === 'confirmed' ? 'success' :
    s === 'cancelled' ? 'error'   :
    s === 'completed' ? 'info'    : 'warning';

  const upcoming   = appointments.filter(a =>
    a.status === 'pending' || a.status === 'confirmed');
  const completed  = appointments.filter(a => a.status === 'completed');
  const uniquePatients = [...new Set(appointments.map(a =>
    a.patientId?._id))].length;

  return (
    <Box sx={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Navbar */}
      <Box sx={{ background: '#1b5e20', color: 'white',
                 px: 4, py: 2, display: 'flex',
                 justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MedicalServices />
          <Typography variant="h6" fontWeight={700}>
            Telemedicine — Doctor Portal
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#66bb6a', width: 36, height: 36 }}>
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
                     background: 'linear-gradient(135deg, #1b5e20, #66bb6a)',
                     color: 'white' }}>
          <Typography variant="h5" fontWeight={700}>
            Good day, {user?.name}! 🩺
          </Typography>
          <Typography sx={{ mt: 1, opacity: 0.9 }}>
            You have {upcoming.length} upcoming appointment{upcoming.length !== 1 ? 's' : ''} today.
          </Typography>
        </Paper>

        {/* Stats */}
        <Grid container spacing={3} mb={3}>
          {[
            { label: 'Total Appointments', value: appointments.length,
              icon: <CalendarMonth sx={{ fontSize: 40, color: '#1565c0' }} />,
              bg: '#e3f2fd' },
            { label: 'Upcoming',           value: upcoming.length,
              icon: <AccessTime sx={{ fontSize: 40, color: '#2e7d32' }} />,
              bg: '#e8f5e9' },
            { label: 'Completed',          value: completed.length,
              icon: <CheckCircle sx={{ fontSize: 40, color: '#f57c00' }} />,
              bg: '#fff3e0' },
            { label: 'Total Patients',     value: uniquePatients,
              icon: <People sx={{ fontSize: 40, color: '#6a1b9a' }} />,
              bg: '#f3e5f5' },
          ].map((s, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ borderRadius: 3, background: s.bg }}>
                <CardContent sx={{ display: 'flex',
                                   justifyContent: 'space-between',
                                   alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                    <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                  </Box>
                  {s.icon}
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

        {/* Appointments List */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            📋 Patient Appointments
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {appointments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <CalendarMonth sx={{ fontSize: 60, opacity: 0.3 }} />
              <Typography mt={2}>No appointments scheduled yet.</Typography>
            </Box>
          ) : (
            appointments.map((appt) => (
              <Paper key={appt._id} variant="outlined"
                sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between',
                           alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="primary" />
                      <Typography fontWeight={600}>
                        {appt.patientId?.name || 'Patient'}
                      </Typography>
                      <Chip label={appt.status} size="small"
                        color={statusColor(appt.status)} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      🕐 {new Date(appt.startTime).toLocaleString()} —{' '}
                          {new Date(appt.endTime).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      🌍 {appt.timezone}
                    </Typography>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {appt.status === 'pending' && (
                      <Button size="small" variant="contained"
                        color="success" onClick={() => handleConfirm(appt._id)}
                        sx={{ borderRadius: 2 }}>
                        Confirm
                      </Button>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <Button size="small" variant="contained"
                          startIcon={<VideoCall />}
                          onClick={() => navigate('/video-room')}
                          sx={{ borderRadius: 2 }}>
                          Start Call
                        </Button>
                        <Button size="small" variant="outlined"
                          color="success"
                          onClick={() => handleComplete(appt._id)}
                          sx={{ borderRadius: 2 }}>
                          Complete
                        </Button>
                      </>
                    )}
                    <Button size="small" variant="outlined"
                      startIcon={<NoteAdd />}
                      onClick={() => { setSelectedAppt(appt); setOpenNote(true); }}
                      sx={{ borderRadius: 2 }}>
                      Add Note
                    </Button>
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Paper>
      </Box>

      {/* Clinical Note Dialog */}
      <Dialog open={openNote} onClose={() => setOpenNote(false)}
        maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>📝 Add Clinical Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Patient: {selectedAppt?.patientId?.name}
          </Typography>
          <TextField fullWidth multiline rows={5}
            label="Clinical notes, diagnosis, observations..."
            value={note}
            onChange={e => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenNote(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNote}
            sx={{ borderRadius: 2 }}>
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}