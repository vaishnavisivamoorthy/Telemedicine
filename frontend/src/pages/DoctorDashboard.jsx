import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Box, Typography, Button, Paper, Grid, Chip,
  Avatar, Divider, Card, CardContent, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tabs, Tab
} from '@mui/material';
import {
  VideoCall, MedicalServices, Logout, Person,
  AccessTime, CheckCircle, CalendarMonth,
  NoteAdd, People, Schedule, Cancel, Done
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
  const [tab, setTab]                   = useState(0);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await API.get('/appointments');
      // Sort by startTime ascending
      const sorted = res.data.sort((a, b) =>
        new Date(a.startTime) - new Date(b.startTime));
      setAppointments(sorted);
    } catch (err) { console.error(err); }
  };

  const handleConfirm = async (id) => {
    try {
      await API.patch(`/appointments/${id}/confirm`);
      setSuccess('Appointment confirmed!');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleComplete = async (id) => {
    try {
      await API.patch(`/appointments/${id}/complete`);
      setSuccess('Marked as completed!');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.patch(`/appointments/${id}/cancel`);
      setSuccess('Appointment cancelled.');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // Grouped lists
  const pending   = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const upcoming  = [...pending, ...confirmed].sort((a, b) =>
    new Date(a.startTime) - new Date(b.startTime));
  const completed = appointments.filter(a => a.status === 'completed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const tabData = [
    { label: 'Upcoming', icon: <Schedule />,
      count: upcoming.length,  color: '#1565c0', data: upcoming },
    { label: 'Completed', icon: <Done />,
      count: completed.length, color: '#2e7d32', data: completed },
    { label: 'Cancelled', icon: <Cancel />,
      count: cancelled.length, color: '#c62828', data: cancelled },
  ];

  const AppointmentCard = ({ appt }) => (
    <Paper variant="outlined"
      sx={{ p: 2, mb: 2, borderRadius: 2,
            borderLeft: `4px solid ${
              appt.status === 'confirmed' ? '#2e7d32' :
              appt.status === 'completed' ? '#1565c0' :
              appt.status === 'cancelled' ? '#c62828' : '#f57c00'
            }` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between',
                 alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Avatar sx={{ width: 32, height: 32,
                          background: '#e3f2fd', color: '#1565c0',
                          fontSize: 14 }}>
              {appt.patientId?.name?.[0]?.toUpperCase() || 'P'}
            </Avatar>
            <Typography fontWeight={700}>
              {appt.patientId?.name || 'Patient'}
            </Typography>
            <Chip label={appt.status} size="small"
              color={
                appt.status === 'confirmed' ? 'success' :
                appt.status === 'completed' ? 'info'    :
                appt.status === 'cancelled' ? 'error'   : 'warning'
              } />
          </Box>
          <Typography variant="body2" color="text.secondary">
            📅 {new Date(appt.startTime).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric',
              month:   'short', year: 'numeric'
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🕐 {new Date(appt.startTime).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit', hour12: true
            })} — {new Date(appt.endTime).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit', hour12: true
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            🌍 {appt.timezone}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap',
                   alignItems: 'center' }}>
          {appt.status === 'pending' && (
            <Button size="small" variant="contained" color="success"
              onClick={() => handleConfirm(appt._id)}
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
              <Button size="small" variant="outlined" color="success"
                onClick={() => handleComplete(appt._id)}
                sx={{ borderRadius: 2 }}>
                Complete
              </Button>
            </>
          )}
          {(appt.status === 'pending' ||
            appt.status === 'confirmed') && (
            <Button size="small" variant="outlined" color="error"
              onClick={() => handleCancel(appt._id)}
              sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
          )}
          <Button size="small" variant="outlined"
            startIcon={<NoteAdd />}
            onClick={() => { setSelectedAppt(appt); setOpenNote(true); }}
            sx={{ borderRadius: 2 }}>
            Note
          </Button>
        </Box>
      </Box>
    </Paper>
  );

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
            You have {upcoming.length} upcoming appointment
            {upcoming.length !== 1 ? 's' : ''}.
          </Typography>
        </Paper>

        {/* Stats */}
        <Grid container spacing={3} mb={3}>
          {[
            { label: 'Total',    value: appointments.length,
              icon: <CalendarMonth sx={{ fontSize: 40, color: '#1565c0' }} />,
              bg: '#e3f2fd' },
            { label: 'Upcoming', value: upcoming.length,
              icon: <AccessTime sx={{ fontSize: 40, color: '#2e7d32' }} />,
              bg: '#e8f5e9' },
            { label: 'Completed', value: completed.length,
              icon: <CheckCircle sx={{ fontSize: 40, color: '#f57c00' }} />,
              bg: '#fff3e0' },
            { label: 'Patients',
              value: [...new Set(appointments.map(a =>
                a.patientId?._id))].length,
              icon: <People sx={{ fontSize: 40, color: '#6a1b9a' }} />,
              bg: '#f3e5f5' },
          ].map((s, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ borderRadius: 3, background: s.bg }}>
                <CardContent sx={{ display: 'flex',
                                   justifyContent: 'space-between',
                                   alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {s.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.label}
                    </Typography>
                  </Box>
                  {s.icon}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {success && <Alert severity="success" sx={{ mb: 2 }}
          onClose={() => setSuccess('')}>{success}</Alert>}
        {error   && <Alert severity="error"   sx={{ mb: 2 }}
          onClose={() => setError('')}>{error}</Alert>}

        {/* Tabbed Appointments */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: '1px solid #e0e0e0',
                  background: '#fafafa' }}>
            {tabData.map((t, i) => (
              <Tab key={i}
                icon={t.icon}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex',
                             alignItems: 'center', gap: 1 }}>
                    {t.label}
                    <Chip label={t.count} size="small"
                      sx={{ background: t.color, color: 'white',
                            height: 20, fontSize: 11 }} />
                  </Box>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabData[tab].data.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6,
                         color: 'text.secondary' }}>
                <CalendarMonth sx={{ fontSize: 60, opacity: 0.3 }} />
                <Typography mt={2}>
                  No {tabData[tab].label.toLowerCase()} appointments
                </Typography>
              </Box>
            ) : (
              tabData[tab].data.map(appt => (
                <AppointmentCard key={appt._id} appt={appt} />
              ))
            )}
          </Box>
        </Paper>
      </Box>

      {/* Note Dialog */}
      <Dialog open={openNote} onClose={() => setOpenNote(false)}
        maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>📝 Clinical Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Patient: {selectedAppt?.patientId?.name} |{' '}
            {new Date(selectedAppt?.startTime).toLocaleDateString()}
          </Typography>
          <TextField fullWidth multiline rows={5}
            label="Diagnosis, observations, treatment notes..."
            value={note}
            onChange={e => setNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenNote(false)}>Cancel</Button>
          <Button variant="contained"
            onClick={() => {
              setSuccess('Note saved!');
              setOpenNote(false);
              setNote('');
            }}
            sx={{ borderRadius: 2 }}>
            Save Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}