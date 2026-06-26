import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Box, Typography, Button, Paper, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Avatar, Divider, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  CalendarMonth, VideoCall, MedicalServices,
  Logout, Person, AccessTime, CheckCircle, Cancel
} from '@mui/icons-material';

const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Dermatologist',
  'Neurologist', 'Pediatrician', 'Orthopedist', 'Gynecologist'
];

export default function PatientDashboard() {
  const { user, logout }                = useAuth();
  const navigate                        = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [allDoctors, setAllDoctors]     = useState([]);
  const [slots, setSlots]               = useState([]);
  const [openBook, setOpenBook]         = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [filterSpec, setFilterSpec]     = useState('All');
  const [step, setStep]                 = useState(1);
  const [form, setForm] = useState({
    doctorId: '', date: '', selectedSlot: null
  });

  useEffect(() => { fetchAppointments(); fetchDoctors(); }, []);

  const fetchAppointments = async () => {
    try {
      const res = await API.get('/appointments');
      setAppointments(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await API.get('/appointments/doctors');
      setAllDoctors(res.data);
      setDoctors(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSlots = async (doctorId, date) => {
    try {
      const res = await API.get(
        `/appointments/slots/${doctorId}?date=${date}`
      );
      setSlots(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSpecFilter = (spec) => {
    setFilterSpec(spec);
    setDoctors(spec === 'All'
      ? allDoctors
      : allDoctors.filter(d =>
          (d.specialization || 'General Physician') === spec));
  };

  const handleSelectDoctor = (doctorId) => {
    setForm({ ...form, doctorId, date: '', selectedSlot: null });
    setSlots([]);
    setStep(2);
  };

  const handleDateChange = (date) => {
    setForm({ ...form, date, selectedSlot: null });
    if (form.doctorId && date) fetchSlots(form.doctorId, date);
  };

  const handleSelectSlot = (slot) => {
    if (!slot.available) return;
    setForm({ ...form, selectedSlot: slot });
  };

  const handleBook = async () => {
    try {
      setError('');
      await API.post('/appointments', {
        doctorId:  form.doctorId,
        startTime: form.selectedSlot.startTime,
        endTime:   form.selectedSlot.endTime,
        timezone:  'Asia/Kolkata'
      });
      setSuccess('Appointment booked successfully!');
      setOpenBook(false);
      setStep(1);
      setForm({ doctorId: '', date: '', selectedSlot: null });
      setSlots([]);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.patch(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const statusColor = (s) =>
    s === 'confirmed' ? 'success' :
    s === 'cancelled' ? 'error'   :
    s === 'completed' ? 'info'    : 'warning';

  return (
    <Box sx={{ minHeight: '100vh', background: '#f0f4f8' }}>

      {/* Navbar */}
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
            Manage your appointments and health records.
          </Typography>
        </Paper>

        {/* Stats */}
        <Grid container spacing={3} mb={3}>
          {[
            { label: 'Total',     value: appointments.length,
              icon: <CalendarMonth sx={{ fontSize: 40, color: '#1565c0' }} />,
              bg: '#e3f2fd' },
            { label: 'Upcoming',
              value: appointments.filter(a =>
                a.status === 'pending' || a.status === 'confirmed').length,
              icon: <AccessTime sx={{ fontSize: 40, color: '#2e7d32' }} />,
              bg: '#e8f5e9' },
            { label: 'Completed',
              value: appointments.filter(a =>
                a.status === 'completed').length,
              icon: <CheckCircle sx={{ fontSize: 40, color: '#f57c00' }} />,
              bg: '#fff3e0' },
            { label: 'Cancelled',
              value: appointments.filter(a =>
                a.status === 'cancelled').length,
              icon: <Cancel sx={{ fontSize: 40, color: '#c62828' }} />,
              bg: '#ffebee' },
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

        {/* Appointments */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between',
                     alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              📅 My Appointments
            </Typography>
            <Button variant="contained" startIcon={<CalendarMonth />}
              onClick={() => { setError(''); setStep(1); setOpenBook(true); }}
              sx={{ borderRadius: 2 }}>
              Book Appointment
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {appointments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6,
                       color: 'text.secondary' }}>
              <CalendarMonth sx={{ fontSize: 60, opacity: 0.3 }} />
              <Typography mt={2}>No appointments yet.</Typography>
            </Box>
          ) : (
            appointments.map(appt => (
  <Paper key={appt._id} variant="outlined"
    sx={{ p: 2, mb: 2, borderRadius: 2,
          borderLeft: `4px solid ${
            appt.status === 'confirmed' ? '#2e7d32' :
            appt.status === 'completed' ? '#1565c0' :
            appt.status === 'cancelled' ? '#c62828' : '#f57c00'
          }` }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between',
               alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person fontSize="small" color="primary" />
          <Typography fontWeight={600}>
            Dr. {appt.doctorId?.name || 'Unknown'}
          </Typography>
          <Chip label={appt.status} size="small"
            color={statusColor(appt.status)} />
        </Box>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          📅 {new Date(appt.startTime).toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric',
            month: 'short', year: 'numeric'
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
          🏥 {appt.doctorId?.specialization || 'General Physician'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Join call for confirmed */}
        {appt.status === 'confirmed' && (
          <Button size="small" variant="contained"
            startIcon={<VideoCall />}
            onClick={() => navigate('/video-room')}
            sx={{ borderRadius: 2, background: '#2e7d32' }}>
            Join Call
          </Button>
        )}
        {/* Cancel for pending or confirmed */}
        {(appt.status === 'pending' ||
          appt.status === 'confirmed') && (
          <Button size="small" variant="outlined"
            color="error" startIcon={<Cancel />}
            onClick={() => handleCancel(appt._id)}
            sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
        )}
        {/* Completed badge */}
        {appt.status === 'completed' && (
          <Chip icon={<CheckCircle />}
            label="Consultation done"
            color="info" variant="outlined" size="small" />
        )}
        {/* Cancelled badge */}
        {appt.status === 'cancelled' && (
          <Chip icon={<Cancel />}
            label="Cancelled"
            color="error" variant="outlined" size="small" />
        )}
      </Box>
    </Box>
  </Paper>
))
          )}
        </Paper>
      </Box>

      {/* ── Book Appointment Dialog ── */}
      <Dialog open={openBook}
        onClose={() => { setOpenBook(false); setError(''); }}
        maxWidth="md" fullWidth>

        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            📅 Book New Appointment
          </Typography>
          {/* Step indicator */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {['Choose Doctor', 'Pick Date & Slot', 'Confirm'].map((s, i) => (
              <Chip key={i} label={`${i + 1}. ${s}`} size="small"
                color={step === i + 1 ? 'primary' : 'default'}
                variant={step === i + 1 ? 'filled' : 'outlined'} />
            ))}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, minHeight: 400 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}
            onClose={() => setError('')}>{error}</Alert>}

          {/* ── STEP 1: Choose Doctor ── */}
          {step === 1 && (
            <Box>
              {/* Specialization filter */}
              <Typography variant="subtitle2" fontWeight={700}
                color="#1565c0" mb={1}>
                Filter by Specialization
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap',
                         gap: 1, mb: 3 }}>
                {SPECIALIZATIONS.map(spec => (
                  <Chip key={spec} label={spec} clickable
                    color={filterSpec === spec ? 'primary' : 'default'}
                    variant={filterSpec === spec ? 'filled' : 'outlined'}
                    onClick={() => handleSpecFilter(spec)}
                    size="small" />
                ))}
              </Box>

              <Typography variant="subtitle2" fontWeight={700}
                color="#1565c0" mb={1}>
                Available Doctors ({doctors.length})
              </Typography>
              <Grid container spacing={2}>
                {doctors.length === 0 ? (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      No doctors found for this specialization
                    </Alert>
                  </Grid>
                ) : (
                  doctors.map(d => (
                    <Grid item xs={12} sm={6} key={d._id}>
                      <Paper onClick={() => handleSelectDoctor(d._id)}
                        sx={{ p: 2, borderRadius: 2, cursor: 'pointer',
                              border: form.doctorId === d._id
                                ? '2px solid #1565c0'
                                : '2px solid #eee',
                              background: form.doctorId === d._id
                                ? '#e3f2fd' : '#fafafa',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor: '#90caf9',
                                           background: '#f0f7ff' } }}>
                        <Box sx={{ display: 'flex',
                                   alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 56, height: 56,
                                        fontSize: 24, fontWeight: 700,
                                        background: '#1565c0' }}>
                            {d.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={700}>
                              Dr. {d.name}
                            </Typography>
                            <Typography variant="body2"
                              color="text.secondary">
                              🏥 {d.specialization || 'General Physician'}
                            </Typography>
                            <Box sx={{ display: 'flex',
                                       alignItems: 'center',
                                       gap: 1, mt: 0.5 }}>
                              <Chip label="Available" size="small"
                                color="success"
                                sx={{ height: 18, fontSize: 10 }} />
                              <Typography variant="caption"
                                color="text.secondary">
                                30-min slots
                              </Typography>
                            </Box>
                          </Box>
                          {form.doctorId === d._id && (
                            <CheckCircle color="primary" />
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          )}

          {/* ── STEP 2: Pick Date & Slot ── */}
          {step === 2 && (
            <Box>
              <Button size="small" onClick={() => setStep(1)} sx={{ mb: 2 }}>
                ← Back to Doctors
              </Button>

              {/* Selected doctor recap */}
              <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2,
                           background: '#e3f2fd',
                           display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ background: '#1565c0' }}>
                  {allDoctors.find(d => d._id === form.doctorId)
                    ?.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} variant="body2">
                    Dr. {allDoctors.find(d => d._id === form.doctorId)?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {allDoctors.find(d => d._id === form.doctorId)
                      ?.specialization || 'General Physician'}
                  </Typography>
                </Box>
              </Paper>

              <Typography variant="subtitle2" fontWeight={700}
                color="#1565c0" mb={1}>
                Select Appointment Date
              </Typography>
              <TextField fullWidth type="date"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
                value={form.date}
                onChange={e => handleDateChange(e.target.value)}
                sx={{ mb: 3 }} />

              {/* Time Slots */}
              {form.date && (
                <>
                  <Typography variant="subtitle2" fontWeight={700}
                    color="#1565c0" mb={1}>
                    Available Time Slots — {new Date(form.date)
                      .toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric',
                        month: 'long'
                      })}
                  </Typography>

                  {slots.length === 0 ? (
                    <Alert severity="info">Loading slots...</Alert>
                  ) : (
                    <Grid container spacing={1}>
                      {slots.map((slot, i) => (
                        <Grid item xs={6} sm={4} md={3} key={i}>
                          <Paper onClick={() => handleSelectSlot(slot)}
                            sx={{
                              p: 1.5, borderRadius: 2, textAlign: 'center',
                              cursor: slot.available
                                ? 'pointer' : 'not-allowed',
                              border: form.selectedSlot?.startTime
                                        === slot.startTime
                                ? '2px solid #1565c0'
                                : slot.available
                                  ? '2px solid #e0e0e0'
                                  : '2px solid #ffcdd2',
                              background: form.selectedSlot?.startTime
                                            === slot.startTime
                                ? '#e3f2fd'
                                : slot.available ? '#fff' : '#fff8f8',
                              opacity: slot.available ? 1 : 0.6,
                              transition: 'all 0.15s',
                              '&:hover': slot.available
                                ? { borderColor: '#90caf9',
                                    background: '#f0f7ff' } : {}
                            }}>
                            <Typography variant="body2" fontWeight={600}
                              color={slot.available
                                ? 'text.primary' : 'text.disabled'}>
                              {new Date(slot.startTime)
                                .toLocaleTimeString('en-IN', {
                                  hour: '2-digit', minute: '2-digit',
                                  hour12: true
                                })}
                            </Typography>
                            <Chip
                              label={slot.available ? 'Free' : 'Booked'}
                              size="small"
                              color={slot.available ? 'success' : 'error'}
                              sx={{ mt: 0.5, height: 16, fontSize: 9 }} />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {/* Selected slot alert */}
                  {form.selectedSlot && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      ✅ Selected: {form.selectedSlot.label} —
                      Duration: 30 minutes
                    </Alert>
                  )}
                </>
              )}
            </Box>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && (
            <Box>
              <Button size="small" onClick={() => setStep(2)} sx={{ mb: 2 }}>
                ← Back to Slots
              </Button>
              <Typography variant="subtitle2" fontWeight={700}
                color="#1565c0" mb={2}>
                Confirm Your Appointment
              </Typography>
              <Paper sx={{ p: 3, borderRadius: 2, background: '#f0f7ff',
                           border: '1px solid #bbdefb' }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  📋 Booking Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {[
                  ['👨‍⚕️ Doctor',
                   `Dr. ${allDoctors.find(d =>
                     d._id === form.doctorId)?.name}`],
                  ['🏥 Specialization',
                   allDoctors.find(d => d._id === form.doctorId)
                     ?.specialization || 'General Physician'],
                  ['📅 Date',
                   new Date(form.date).toLocaleDateString('en-IN', {
                     weekday: 'long', year: 'numeric',
                     month: 'long', day: 'numeric'
                   })],
                  ['🕐 Time', form.selectedSlot?.label],
                  ['⏱️ Duration', '30 minutes'],
                  ['🌍 Timezone', 'Asia/Kolkata'],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex',
                                         justifyContent: 'space-between',
                                         py: 1,
                                         borderBottom: '1px solid #e3f2fd' }}>
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => { setOpenBook(false); setError(''); }}>
            Cancel
          </Button>
          {step === 1 && (
            <Button variant="contained"
              disabled={!form.doctorId}
              onClick={() => setStep(2)}
              sx={{ borderRadius: 2 }}>
              Next: Pick Date & Time →
            </Button>
          )}
          {step === 2 && (
            <Button variant="contained"
              disabled={!form.selectedSlot}
              onClick={() => setStep(3)}
              sx={{ borderRadius: 2 }}>
              Next: Review →
            </Button>
          )}
          {step === 3 && (
            <Button variant="contained" color="success"
              onClick={handleBook}
              sx={{ borderRadius: 2, px: 4 }}>
              ✅ Confirm Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}