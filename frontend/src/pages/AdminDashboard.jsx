import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  Box, Typography, Button, Paper, Grid, Chip,
  Avatar, Card, CardContent, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, InputLabel,
  FormControl, Tabs, Tab, Divider, IconButton
} from '@mui/material';
import {
  MedicalServices, People, CalendarMonth,
  Logout, PersonAdd, Delete, CheckCircle,
  AdminPanelSettings, BarChart, LocalHospital
} from '@mui/icons-material';

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist',
  'Neurologist', 'Pediatrician', 'Orthopedist', 'Gynecologist',
  'Psychiatrist', 'Ophthalmologist', 'ENT Specialist'
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [tab, setTab]    = useState(0);
  const [doctors, setDoctors]   = useState([]);
  const [patients, setPatients] = useState([]);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [openAdd, setOpenAdd]   = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    specialization: 'General Physician', role: 'doctor'
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        API.get('/admin/doctors'),
        API.get('/admin/patients')
      ]);
      setDoctors(docRes.data);
      setPatients(patRes.data);
    } catch (err) { console.error(err); }
  };

  const handleAddDoctor = async () => {
    try {
      setError('');
      if (!form.name || !form.email || !form.password) {
        setError('All fields are required');
        return;
      }
      await API.post('/admin/add-doctor', form);
      setSuccess(`Dr. ${form.name} added successfully!`);
      setOpenAdd(false);
      setForm({ name:'', email:'', password:'',
                specialization:'General Physician', role:'doctor' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add doctor');
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Remove Dr. ${name}?`)) return;
    try {
      await API.delete(`/admin/doctors/${id}`);
      setSuccess(`Dr. ${name} removed`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // Group doctors by specialization
  const bySpec = SPECIALIZATIONS.reduce((acc, s) => {
    acc[s] = doctors.filter(d =>
      (d.specialization || 'General Physician') === s);
    return acc;
  }, {});

  return (
    <Box sx={{ minHeight:'100vh', background:'#f0f4f8' }}>

      {/* Navbar */}
      <Box sx={{ background:'#4a148c', color:'white',
                 px:4, py:2, display:'flex',
                 justifyContent:'space-between', alignItems:'center' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
          <AdminPanelSettings />
          <Typography variant="h6" fontWeight={700}>
            MediConnect — Admin Portal
          </Typography>
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
          <Avatar sx={{ bgcolor:'#9c27b0', width:36, height:36 }}>
            {user?.name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography>{user?.name}</Typography>
          <Button color="inherit" startIcon={<Logout />}
            onClick={handleLogout}>Logout</Button>
        </Box>
      </Box>

      <Box sx={{ p:4 }}>
        {/* Banner */}
        <Paper sx={{ p:3, mb:3, borderRadius:3,
                     background:'linear-gradient(135deg, #4a148c, #9c27b0)',
                     color:'white' }}>
          <Typography variant="h5" fontWeight={700}>
            Admin Control Panel 🛡️
          </Typography>
          <Typography sx={{ mt:1, opacity:0.9 }}>
            Manage doctors, patients, and platform settings.
          </Typography>
        </Paper>

        {/* Stats */}
        <Grid container spacing={3} mb={3}>
          {[
            { label:'Total Doctors',   value:doctors.length,
              icon:<LocalHospital sx={{ fontSize:40, color:'#1565c0' }} />,
              bg:'#e3f2fd' },
            { label:'Total Patients',  value:patients.length,
              icon:<People sx={{ fontSize:40, color:'#2e7d32' }} />,
              bg:'#e8f5e9' },
            { label:'Specializations',
              value:Object.values(bySpec).filter(a => a.length > 0).length,
              icon:<MedicalServices sx={{ fontSize:40, color:'#f57c00' }} />,
              bg:'#fff3e0' },
            { label:'Active Today',    value:doctors.length,
              icon:<CheckCircle sx={{ fontSize:40, color:'#6a1b9a' }} />,
              bg:'#f3e5f5' },
          ].map((s, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ borderRadius:3, background:s.bg }}>
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

        {/* Tabs */}
        <Paper sx={{ borderRadius:3, overflow:'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ background:'#fafafa',
                  borderBottom:'1px solid #e0e0e0' }}>
            <Tab label="👨‍⚕️ Manage Doctors" />
            <Tab label="🧑‍🤝‍🧑 Manage Patients" />
            <Tab label="📊 By Specialization" />
          </Tabs>

          {/* ── TAB 0: Doctors ── */}
          {tab === 0 && (
            <Box sx={{ p:3 }}>
              <Box sx={{ display:'flex', justifyContent:'space-between',
                         mb:3 }}>
                <Typography variant="h6" fontWeight={700}>
                  All Doctors ({doctors.length})
                </Typography>
                <Button variant="contained" startIcon={<PersonAdd />}
                  onClick={() => { setError(''); setOpenAdd(true); }}
                  sx={{ borderRadius:2, background:'#4a148c' }}>
                  Add New Doctor
                </Button>
              </Box>
              <Grid container spacing={2}>
                {doctors.map(d => (
                  <Grid item xs={12} sm={6} md={4} key={d._id}>
                    <Paper variant="outlined"
                      sx={{ p:2.5, borderRadius:2,
                            '&:hover': { borderColor:'#9c27b0',
                                         background:'#fdf4ff' } }}>
                      <Box sx={{ display:'flex',
                                 alignItems:'center', gap:2 }}>
                        <Avatar sx={{ width:52, height:52,
                                      background:'#4a148c',
                                      fontSize:22, fontWeight:700 }}>
                          {d.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex:1 }}>
                          <Typography fontWeight={700}>
                            Dr. {d.name}
                          </Typography>
                          <Chip label={d.specialization || 'General'}
                            size="small"
                            sx={{ background:'#f3e5f5',
                                  color:'#6a1b9a', fontSize:10,
                                  height:20, mt:0.5 }} />
                          <Typography variant="caption"
                            color="text.secondary" display="block" mt={0.5}>
                            ✉️ {d.email}
                          </Typography>
                        </Box>
                        <IconButton size="small" color="error"
                          onClick={() =>
                            handleDeleteDoctor(d._id, d.name)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* ── TAB 1: Patients ── */}
          {tab === 1 && (
            <Box sx={{ p:3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>
                All Patients ({patients.length})
              </Typography>
              <Grid container spacing={2}>
                {patients.map(p => (
                  <Grid item xs={12} sm={6} md={4} key={p._id}>
                    <Paper variant="outlined"
                      sx={{ p:2.5, borderRadius:2 }}>
                      <Box sx={{ display:'flex',
                                 alignItems:'center', gap:2 }}>
                        <Avatar sx={{ width:46, height:46,
                                      background:'#1565c0',
                                      fontWeight:700 }}>
                          {p.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700}>{p.name}</Typography>
                          <Typography variant="caption"
                            color="text.secondary">
                            ✉️ {p.email}
                          </Typography>
                          <Typography variant="caption"
                            color="text.secondary" display="block">
                            🗓️ Joined: {new Date(p.createdAt)
                              .toLocaleDateString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* ── TAB 2: By Specialization ── */}
          {tab === 2 && (
            <Box sx={{ p:3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>
                Doctors by Specialization
              </Typography>
              {SPECIALIZATIONS.map(spec => (
                bySpec[spec]?.length > 0 && (
                  <Box key={spec} mb={3}>
                    <Box sx={{ display:'flex', alignItems:'center',
                               gap:2, mb:1.5 }}>
                      <Typography fontWeight={700} color="#4a148c">
                        {spec}
                      </Typography>
                      <Chip label={`${bySpec[spec].length} doctor(s)`}
                        size="small"
                        sx={{ background:'#f3e5f5', color:'#6a1b9a' }} />
                    </Box>
                    <Grid container spacing={2}>
                      {bySpec[spec].map(d => (
                        <Grid item xs={12} sm={6} md={3} key={d._id}>
                          <Paper sx={{ p:2, borderRadius:2,
                                       background:'#fdf4ff',
                                       border:'1px solid #e1bee7' }}>
                            <Box sx={{ display:'flex',
                                       alignItems:'center', gap:1.5 }}>
                              <Avatar sx={{ background:'#9c27b0',
                                            width:36, height:36,
                                            fontSize:14 }}>
                                {d.name?.[0]?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={700}>
                                  Dr. {d.name}
                                </Typography>
                                <Typography variant="caption"
                                  color="text.secondary">
                                  {d.email}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <Divider sx={{ mt:2 }} />
                  </Box>
                )
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Add Doctor Dialog */}
      <Dialog open={openAdd}
        onClose={() => { setOpenAdd(false); setError(''); }}
        maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          👨‍⚕️ Add New Doctor
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
          <TextField fullWidth label="Full Name" margin="normal"
            value={form.name}
            onChange={e => setForm({ ...form, name:e.target.value })}
            placeholder="e.g. Rajesh Kumar" />
          <TextField fullWidth label="Email" margin="normal"
            type="email" value={form.email}
            onChange={e => setForm({ ...form, email:e.target.value })}
            placeholder="doctor@clinic.com" />
          <TextField fullWidth label="Temporary Password" margin="normal"
            type="password" value={form.password}
            onChange={e => setForm({ ...form, password:e.target.value })}
            placeholder="Min 8 characters" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Specialization</InputLabel>
            <Select value={form.specialization} label="Specialization"
              onChange={e => setForm({ ...form, specialization:e.target.value })}>
              {SPECIALIZATIONS.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p:3 }}>
          <Button onClick={() => { setOpenAdd(false); setError(''); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddDoctor}
            sx={{ borderRadius:2, background:'#4a148c' }}>
            Add Doctor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}