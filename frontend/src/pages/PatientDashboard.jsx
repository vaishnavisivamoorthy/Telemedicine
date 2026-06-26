import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

import {
  Box, Typography, Button, Paper, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Avatar, Divider, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab
} from '@mui/material';

import {
  CalendarMonth, VideoCall, MedicalServices,
  Logout, Person, AccessTime, CheckCircle,
  Cancel, Download, Payment, Receipt,
  CreditCard, AccountBalance
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
  const [apptTab, setApptTab]           = useState(0);
  const [form, setForm] = useState({
    doctorId: '', date: '', selectedSlot: null
  });

  const [payments, setPayments]         = useState([]);
const [openPay, setOpenPay]           = useState(false);
const [selectedPayment, setSelectedPayment] = useState(null);
const [payMethod, setPayMethod]       = useState('card');
const [cardNum, setCardNum]           = useState('');
const [cardName, setCardName]         = useState('');
const [cardExpiry, setCardExpiry]     = useState('');
const [cardCVV, setCardCVV]           = useState('');
const [upiId, setUpiId]              = useState('');
const [payLoading, setPayLoading]     = useState(false);
const [paySuccess, setPaySuccess]     = useState('');

  useEffect(() => { fetchAppointments(); fetchDoctors(); fetchPayments(); }, []);

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

  const fetchPayments = async () => {
  try {
    const res = await API.get('/payments/my');
    setPayments(res.data);
  } catch (err) { console.error(err); }
};

const handleCreatePayment = async (appointmentId) => {
  try {
    await API.post('/payments/create', { appointmentId });
    fetchPayments();
    setSuccess('Payment invoice created!');
  } catch (err) {
    if (err.response?.data?.payment) fetchPayments();
    else setError(err.response?.data?.error || 'Failed');
  }
};

const handlePay = async () => {
  try {
    setPayLoading(true);
    setError('');
    if (payMethod === 'card') {
      if (!cardNum || !cardName || !cardExpiry || !cardCVV) {
        setError('Fill all card details'); setPayLoading(false); return;
      }
    }
    if (payMethod === 'upi' && !upiId) {
      setError('Enter UPI ID'); setPayLoading(false); return;
    }
    await API.post(`/payments/pay/${selectedPayment._id}`, {
      paymentMethod: payMethod, cardNumber: cardNum, upiId
    });
    setPaySuccess('Payment successful! 🎉');
    fetchPayments();
    setTimeout(() => {
      setOpenPay(false); setPaySuccess('');
      setCardNum(''); setCardName(''); setCardExpiry(''); setCardCVV('');
      setUpiId('');
    }, 2000);
  } catch (err) {
    setError(err.response?.data?.error || 'Payment failed');
  } finally { setPayLoading(false); }
};

const handleDownloadInvoice = async (paymentId) => {
  try {
    const res = await API.get(`/payments/invoice/${paymentId}`,
      { responseType: 'blob' });
    const url  = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', `invoice-${paymentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) { setError('Invoice download failed'); }
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
      setSuccess('Appointment cancelled.');
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const handleDownloadPrescription = async (appt) => {
  try {
    setError('');
    const res = await API.get(`/prescriptions/patient/${user.id}`);
    const prescriptions = res.data;

    if (prescriptions.length === 0) {
      setError('No prescription found yet. Ask your doctor to generate one.');
      return;
    }

    const doctorId = appt.doctorId?._id || appt.doctorId;
    const match = prescriptions.find(p =>
      (p.doctorId?._id || p.doctorId)?.toString() === doctorId?.toString()
    ) || prescriptions[0];

    // Download existing PDF by ID — does NOT regenerate with wrong doctor
    const pdfRes = await API.get(
      `/prescriptions/download/${match._id}`,
      { responseType: 'blob' }
    );

    const url  = window.URL.createObjectURL(new Blob([pdfRes.data]));
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download',
      `prescription-${user.name}-${new Date(match.createdAt).toLocaleDateString()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setSuccess('Prescription downloaded successfully!');
  } catch (err) {
    setError('Could not download prescription.');
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
            { label: 'Total', value: appointments.length,
              icon: <CalendarMonth sx={{ fontSize:40, color:'#1565c0' }} />,
              bg: '#e3f2fd' },
            { label: 'Upcoming',
              value: appointments.filter(a =>
                a.status === 'pending' || a.status === 'confirmed').length,
              icon: <AccessTime sx={{ fontSize:40, color:'#2e7d32' }} />,
              bg: '#e8f5e9' },
            { label: 'Completed',
              value: appointments.filter(a =>
                a.status === 'completed').length,
              icon: <CheckCircle sx={{ fontSize:40, color:'#f57c00' }} />,
              bg: '#fff3e0' },
            { label: 'Cancelled',
              value: appointments.filter(a =>
                a.status === 'cancelled').length,
              icon: <Cancel sx={{ fontSize:40, color:'#c62828' }} />,
              bg: '#ffebee' },
          ].map((s, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ borderRadius: 3, background: s.bg }}>
                <CardContent sx={{ display:'flex',
                                   justifyContent:'space-between',
                                   alignItems:'center' }}>
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

        {success && <Alert severity="success" sx={{ mb:2 }}
          onClose={() => setSuccess('')}>{success}</Alert>}
        {error   && <Alert severity="error"   sx={{ mb:2 }}
          onClose={() => setError('')}>{error}</Alert>}

        {/* Tabbed Appointments */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ display:'flex', justifyContent:'space-between',
                     alignItems:'center', px:3, pt:2 }}>
            <Typography variant="h6" fontWeight={700}>
              📅 My Appointments
            </Typography>
            <Button variant="contained" startIcon={<CalendarMonth />}
              onClick={() => {
                setError(''); setStep(1); setOpenBook(true);
              }}
              sx={{ borderRadius: 2 }}>
              Book Appointment
            </Button>
          </Box>

          <Tabs value={apptTab} onChange={(_, v) => setApptTab(v)}
            sx={{ px:2, borderBottom:'1px solid #e0e0e0' }}>
            {[
              { label: 'Upcoming',
                count: appointments.filter(a =>
                  a.status === 'pending' ||
                  a.status === 'confirmed').length,
                color: '#1565c0' },
              { label: 'Completed',
                count: appointments.filter(a =>
                  a.status === 'completed').length,
                color: '#2e7d32' },
              { label: 'Cancelled',
                count: appointments.filter(a =>
                  a.status === 'cancelled').length,
                color: '#c62828' },
            ].map((t, i) => (
              <Tab key={i}
                label={
                  <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                    {t.label}
                    <Chip label={t.count} size="small"
                      sx={{ background:t.color, color:'white',
                            height:18, fontSize:10 }} />
                  </Box>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {(() => {
              const filtered = appointments.filter(a =>
                apptTab === 0
                  ? (a.status === 'pending' || a.status === 'confirmed')
                  : apptTab === 1
                    ? a.status === 'completed'
                    : a.status === 'cancelled'
              );

              if (filtered.length === 0) return (
                <Box sx={{ textAlign:'center', py:6,
                           color:'text.secondary' }}>
                  <CalendarMonth sx={{ fontSize:60, opacity:0.3 }} />
                  <Typography mt={2}>
                    No appointments here yet.
                  </Typography>
                </Box>
              );

              return filtered.map(appt => (
                <Paper key={appt._id} variant="outlined"
                  sx={{ p:2, mb:2, borderRadius:2,
                        borderLeft:`4px solid ${
                          appt.status === 'confirmed' ? '#2e7d32' :
                          appt.status === 'completed' ? '#1565c0' :
                          appt.status === 'cancelled' ? '#c62828' : '#f57c00'
                        }` }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between',
                             alignItems:'center',
                             flexWrap:'wrap', gap:1 }}>
                    <Box>
                      <Box sx={{ display:'flex',
                                 alignItems:'center', gap:1 }}>
                        <Person fontSize="small" color="primary" />
                        <Typography fontWeight={600}>
                          Dr. {appt.doctorId?.name || 'Unknown'}
                        </Typography>
                        <Chip label={appt.status} size="small"
                          color={statusColor(appt.status)} />
                      </Box>
                      <Typography variant="body2"
                        color="text.secondary" mt={0.5}>
                        🏥 {appt.doctorId?.specialization ||
                            'General Physician'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📅 {new Date(appt.startTime)
                          .toLocaleDateString('en-IN', {
                            weekday:'short', day:'numeric',
                            month:'short', year:'numeric'
                          })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🕐 {new Date(appt.startTime)
                          .toLocaleTimeString('en-IN', {
                            hour:'2-digit', minute:'2-digit', hour12:true
                          })} — {new Date(appt.endTime)
                          .toLocaleTimeString('en-IN', {
                            hour:'2-digit', minute:'2-digit', hour12:true
                          })}
                      </Typography>
                    </Box>

                    <Box sx={{ display:'flex',
                               alignItems:'center', gap:1 }}>
                      {appt.status === 'confirmed' && (
                        <Button size="small" variant="contained"
                          startIcon={<VideoCall />}
                          onClick={() => navigate('/video-room')}
                          sx={{ borderRadius:2, background:'#2e7d32' }}>
                          Join Call
                        </Button>
                      )}
                      {(appt.status === 'pending' ||
                        appt.status === 'confirmed') && (
                        <Button size="small" variant="outlined"
                          color="error" startIcon={<Cancel />}
                          onClick={() => handleCancel(appt._id)}
                          sx={{ borderRadius:2 }}>
                          Cancel
                        </Button>
                      )}
                      {appt.status === 'completed' && (
                        <Button size="small" variant="outlined"
                          color="primary" startIcon={<Download />}
                          onClick={() =>
                            handleDownloadPrescription(appt)}
                          sx={{ borderRadius:2 }}>
                          Prescription
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ));
            })()}
          </Box>
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
          <Box sx={{ display:'flex', gap:1, mt:1 }}>
            {['Choose Doctor', 'Pick Date & Slot', 'Confirm']
              .map((s, i) => (
                <Chip key={i} label={`${i+1}. ${s}`} size="small"
                  color={step === i+1 ? 'primary' : 'default'}
                  variant={step === i+1 ? 'filled' : 'outlined'} />
              ))}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt:1, minHeight:400 }}>
          {error && (
            <Alert severity="error" sx={{ mb:2 }}
              onClose={() => setError('')}>{error}</Alert>
          )}

          {/* STEP 1 — Choose Doctor */}
          {step === 1 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700}
                color="#1565c0" mb={1}>
                Filter by Specialization
              </Typography>
              <Box sx={{ display:'flex', flexWrap:'wrap',
                         gap:1, mb:3 }}>
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
                      <Paper
                        onClick={() => handleSelectDoctor(d._id)}
                        sx={{ p:2, borderRadius:2, cursor:'pointer',
                              border: form.doctorId === d._id
                                ? '2px solid #1565c0'
                                : '2px solid #eee',
                              background: form.doctorId === d._id
                                ? '#e3f2fd' : '#fafafa',
                              transition: 'all 0.2s',
                              '&:hover': { borderColor:'#90caf9',
                                           background:'#f0f7ff' } }}>
                        <Box sx={{ display:'flex',
                                   alignItems:'center', gap:2 }}>
                          <Avatar sx={{ width:56, height:56,
                                        fontSize:24, fontWeight:700,
                                        background:'#1565c0' }}>
                            {d.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex:1 }}>
                            <Typography fontWeight={700}>
                              Dr. {d.name}
                            </Typography>
                            <Typography variant="body2"
                              color="text.secondary">
                              🏥 {d.specialization || 'General Physician'}
                            </Typography>
                            <Box sx={{ display:'flex',
                                       alignItems:'center',
                                       gap:1, mt:0.5 }}>
                              <Chip label="Available" size="small"
                                color="success"
                                sx={{ height:18, fontSize:10 }} />
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

          {/* STEP 2 — Pick Date & Slot */}
          {step === 2 && (
            <Box>
              <Button size="small" onClick={() => setStep(1)}
                sx={{ mb:2 }}>
                ← Back to Doctors
              </Button>

              <Paper sx={{ p:1.5, mb:2, borderRadius:2,
                           background:'#e3f2fd',
                           display:'flex', alignItems:'center', gap:2 }}>
                <Avatar sx={{ background:'#1565c0' }}>
                  {allDoctors.find(d => d._id === form.doctorId)
                    ?.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} variant="body2">
                    Dr. {allDoctors.find(d =>
                      d._id === form.doctorId)?.name}
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
                InputLabelProps={{ shrink:true }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0]
                }}
                value={form.date}
                onChange={e => handleDateChange(e.target.value)}
                sx={{ mb:3 }} />

              {form.date && (
                <>
                  <Typography variant="subtitle2" fontWeight={700}
                    color="#1565c0" mb={1}>
                    Available Time Slots — {new Date(form.date)
                      .toLocaleDateString('en-IN', {
                        weekday:'long', day:'numeric', month:'long'
                      })}
                  </Typography>

                  {slots.length === 0 ? (
                    <Alert severity="info">Loading slots...</Alert>
                  ) : (
                    <Grid container spacing={1}>
                      {slots.map((slot, i) => (
                        <Grid item xs={6} sm={4} md={3} key={i}>
                          <Paper
                            onClick={() => handleSelectSlot(slot)}
                            sx={{ p:1.5, borderRadius:2,
                                  textAlign:'center',
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
                                    ? { borderColor:'#90caf9',
                                        background:'#f0f7ff' } : {}
                                }}>
                            <Typography variant="body2" fontWeight={600}
                              color={slot.available
                                ? 'text.primary' : 'text.disabled'}>
                              {new Date(slot.startTime)
                                .toLocaleTimeString('en-IN', {
                                  hour:'2-digit', minute:'2-digit',
                                  hour12:true
                                })}
                            </Typography>
                            <Chip
                              label={slot.available ? 'Free' : 'Booked'}
                              size="small"
                              color={slot.available ? 'success' : 'error'}
                              sx={{ mt:0.5, height:16, fontSize:9 }} />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {form.selectedSlot && (
                    <Alert severity="success" sx={{ mt:2 }}>
                      ✅ Selected: {form.selectedSlot.label} —
                      Duration: 30 minutes
                    </Alert>
                  )}
                </>
              )}
            </Box>
          )}

          {/* STEP 3 — Confirm */}
          {step === 3 && (
            <Box>
              <Button size="small" onClick={() => setStep(2)}
                sx={{ mb:2 }}>
                ← Back to Slots
              </Button>
              <Paper sx={{ p:3, borderRadius:2, background:'#f0f7ff',
                           border:'1px solid #bbdefb' }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  📋 Booking Summary
                </Typography>
                <Divider sx={{ mb:2 }} />
                {[
                  ['👨‍⚕️ Doctor',
                   `Dr. ${allDoctors.find(d =>
                     d._id === form.doctorId)?.name}`],
                  ['🏥 Specialization',
                   allDoctors.find(d => d._id === form.doctorId)
                     ?.specialization || 'General Physician'],
                  ['📅 Date',
                   new Date(form.date).toLocaleDateString('en-IN', {
                     weekday:'long', year:'numeric',
                     month:'long', day:'numeric'
                   })],
                  ['🕐 Time', form.selectedSlot?.label],
                  ['⏱️ Duration', '30 minutes'],
                  ['🌍 Timezone', 'Asia/Kolkata'],
                ].map(([label, value]) => (
                  <Box key={label}
                    sx={{ display:'flex', justifyContent:'space-between',
                          py:1, borderBottom:'1px solid #e3f2fd' }}>
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

        <DialogActions sx={{ p:3, pt:1 }}>
          <Button onClick={() => { setOpenBook(false); setError(''); }}>
            Cancel
          </Button>
          {step === 1 && (
            <Button variant="contained" disabled={!form.doctorId}
              onClick={() => setStep(2)} sx={{ borderRadius:2 }}>
              Next: Pick Date & Time →
            </Button>
          )}
          {step === 2 && (
            <Button variant="contained" disabled={!form.selectedSlot}
              onClick={() => setStep(3)} sx={{ borderRadius:2 }}>
              Next: Review →
            </Button>
          )}
          {step === 3 && (
            <Button variant="contained" color="success"
              onClick={handleBook} sx={{ borderRadius:2, px:4 }}>
              ✅ Confirm Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {/* ── Payments Section ── */}
        <Paper sx={{ borderRadius:3, overflow:'hidden', mt:3 }}>
          <Box sx={{ px:3, pt:2.5, pb:1, display:'flex',
                     justifyContent:'space-between', alignItems:'center' }}>
            <Typography variant="h6" fontWeight={700}>
              💳 My Payments
            </Typography>
            <Chip label={`${payments.filter(p=>p.status==='pending'||p.status==='overdue').length} pending`}
              color="warning" size="small" />
          </Box>
          <Divider />
          <Box sx={{ p:3 }}>
            {payments.length === 0 ? (
              <Box sx={{ textAlign:'center', py:5, color:'text.secondary' }}>
                <Typography fontSize={48}>💳</Typography>
                <Typography mt={1}>No payments yet.</Typography>
                <Typography variant="body2" mt={0.5}>
                  Payments are created after your appointment is confirmed.
                </Typography>
              </Box>
            ) : (
              payments.map(pay => {
                const isOverdue = pay.status === 'overdue';
                const isPaid    = pay.status === 'paid';
                return (
                  <Paper key={pay._id} variant="outlined"
                    sx={{ p:2, mb:2, borderRadius:2,
                          borderLeft:`4px solid ${
                            isPaid    ? '#2e7d32' :
                            isOverdue ? '#f44336' : '#f57c00'
                          }`,
                          background: isOverdue ? '#fff8f8' : 'white' }}>
                    <Box sx={{ display:'flex', justifyContent:'space-between',
                               alignItems:'center', flexWrap:'wrap', gap:1 }}>
                      <Box>
                        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                          <Typography fontWeight={700}>
                            {pay.invoiceNumber}
                          </Typography>
                          <Chip label={pay.status} size="small"
                            color={isPaid ? 'success' : isOverdue ? 'error' : 'warning'} />
                          {isOverdue && (
                            <Chip label="⚠️ OVERDUE" size="small"
                              sx={{ background:'#ffebee', color:'#c62828',
                                    fontWeight:700, fontSize:10 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          👨‍⚕️ Dr. {pay.doctorId?.name} — {pay.doctorId?.specialization}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📅 Due: {new Date(pay.dueDate).toLocaleDateString('en-IN')}
                          {isPaid && ` | Paid: ${new Date(pay.paidAt).toLocaleDateString('en-IN')}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pay.description}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign:'right' }}>
                        <Typography variant="h6" fontWeight={800}
                          color={isPaid ? '#2e7d32' : isOverdue ? '#f44336' : '#f57c00'}>
                          ₹{(pay.amount * 1.18).toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          incl. 18% GST
                        </Typography>
                        <Box sx={{ display:'flex', gap:1, mt:1,
                                   justifyContent:'flex-end' }}>
                          {!isPaid && (
                            <Button size="small" variant="contained"
                              startIcon={<CreditCard />}
                              onClick={() => {
                                setSelectedPayment(pay);
                                setOpenPay(true);
                                setError('');
                                setPaySuccess('');
                              }}
                              sx={{ borderRadius:2,
                                    background: isOverdue ? '#f44336' : '#1565c0' }}>
                              Pay Now
                            </Button>
                          )}
                          <Button size="small" variant="outlined"
                            startIcon={<Receipt />}
                            onClick={() => handleDownloadInvoice(pay._id)}
                            sx={{ borderRadius:2 }}>
                            Invoice
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        </Paper>
        {/* ── Payment Dialog ── */}
      <Dialog open={openPay}
        onClose={() => { setOpenPay(false); setError(''); setPaySuccess(''); }}
        maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            💳 Complete Payment
          </Typography>
          {selectedPayment && (
            <Typography variant="body2" color="text.secondary">
              {selectedPayment.invoiceNumber} — ₹{(selectedPayment.amount * 1.18).toFixed(0)} incl. GST
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {paySuccess ? (
            <Box sx={{ textAlign:'center', py:4 }}>
              <Typography fontSize={60}>✅</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main" mt={2}>
                {paySuccess}
              </Typography>
              <Typography color="text.secondary" mt={1}>
                Your invoice will be ready to download shortly.
              </Typography>
            </Box>
          ) : (
            <Box>
              {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}

              {/* Payment Summary */}
              <Paper sx={{ p:2, mb:3, borderRadius:2, background:'#f0f7ff' }}>
                <Typography variant="body2" fontWeight={700} color="#1565c0" mb={1}>
                  Payment Summary
                </Typography>
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography variant="body2">Consultation Fee</Typography>
                  <Typography variant="body2">₹{selectedPayment?.amount}</Typography>
                </Box>
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography variant="body2">GST (18%)</Typography>
                  <Typography variant="body2">
                    ₹{Math.round((selectedPayment?.amount || 0) * 0.18)}
                  </Typography>
                </Box>
                <Divider sx={{ my:1 }} />
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography fontWeight={700}>Total</Typography>
                  <Typography fontWeight={700} color="#1565c0">
                    ₹{Math.round((selectedPayment?.amount || 0) * 1.18)}
                  </Typography>
                </Box>
              </Paper>

              {/* Payment Method Tabs */}
              <Typography variant="subtitle2" fontWeight={700}
                color="#1565c0" mb={1}>
                Select Payment Method
              </Typography>
              <Box sx={{ display:'flex', gap:1, mb:2.5 }}>
                {[
                  { id:'card',       label:'💳 Card' },
                  { id:'upi',        label:'📱 UPI' },
                  { id:'netbanking', label:'🏦 Net Banking' },
                  { id:'wallet',     label:'👛 Wallet' },
                ].map(m => (
                  <Chip key={m.id} label={m.label} clickable
                    onClick={() => setPayMethod(m.id)}
                    color={payMethod === m.id ? 'primary' : 'default'}
                    variant={payMethod === m.id ? 'filled' : 'outlined'}
                    sx={{ fontWeight: payMethod === m.id ? 700 : 400 }} />
                ))}
              </Box>

              {/* Card Form */}
              {payMethod === 'card' && (
                <Box>
                  <TextField fullWidth label="Cardholder Name" margin="dense"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="As on card" />
                  <TextField fullWidth label="Card Number" margin="dense"
                    value={cardNum}
                    onChange={e => setCardNum(e.target.value.replace(/\D/g,'').slice(0,16))}
                    placeholder="1234 5678 9012 3456"
                    inputProps={{ maxLength:16 }} />
                  <Box sx={{ display:'flex', gap:2 }}>
                    <TextField fullWidth label="Expiry (MM/YY)" margin="dense"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      placeholder="MM/YY" />
                    <TextField fullWidth label="CVV" margin="dense"
                      type="password" value={cardCVV}
                      onChange={e => setCardCVV(e.target.value.slice(0,3))}
                      placeholder="***" />
                  </Box>
                  <Alert severity="info" sx={{ mt:1 }}>
                    🔒 Your payment is secured with 256-bit SSL encryption
                  </Alert>
                </Box>
              )}

              {/* UPI Form */}
              {payMethod === 'upi' && (
                <Box>
                  <TextField fullWidth label="UPI ID" margin="dense"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi" />
                  <Typography variant="caption" color="text.secondary">
                    Supported: GPay, PhonePe, Paytm, BHIM
                  </Typography>
                </Box>
              )}

              {/* Net Banking */}
              {payMethod === 'netbanking' && (
                <Box>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Select Bank</InputLabel>
                    <Select label="Select Bank" defaultValue="">
                      {['SBI','HDFC','ICICI','Axis','Kotak','PNB'].map(b => (
                        <MenuItem key={b} value={b}>{b} Bank</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Alert severity="info" sx={{ mt:1 }}>
                    You will be redirected to your bank's secure portal
                  </Alert>
                </Box>
              )}

              {/* Wallet */}
              {payMethod === 'wallet' && (
                <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', mt:1 }}>
                  {['Paytm','PhonePe','Amazon Pay','Mobikwik'].map(w => (
                    <Chip key={w} label={w} clickable variant="outlined"
                      onClick={() => setUpiId(w)} />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        {!paySuccess && (
          <DialogActions sx={{ p:3 }}>
            <Button onClick={() => { setOpenPay(false); setError(''); }}>
              Cancel
            </Button>
            <Button variant="contained" disabled={payLoading}
              onClick={handlePay}
              sx={{ borderRadius:2, px:4, background:'#1565c0',
                    fontWeight:700 }}>
              {payLoading ? 'Processing...' : `Pay ₹${Math.round((selectedPayment?.amount||0)*1.18)}`}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}