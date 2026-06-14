import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Paper, Avatar,
  Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider
} from '@mui/material';
import {
  MedicalServices, VideoCall, Security, Schedule,
  LocalPharmacy, Phone, Email, LocationOn,
  CheckCircle, Close
} from '@mui/icons-material';

const SPECIALIZATIONS = [
  { name: 'Cardiology',   icon: '❤️', desc: 'Heart & cardiovascular care' },
  { name: 'Neurology',    icon: '🧠', desc: 'Brain & nervous system' },
  { name: 'Dermatology',  icon: '🫁', desc: 'Skin conditions & care' },
  { name: 'Pediatrics',   icon: '👶', desc: 'Children health care' },
  { name: 'Orthopedics',  icon: '🦴', desc: 'Bones & joints' },
  { name: 'General',      icon: '🩺', desc: 'General medicine' },
];

const FEATURES = [
  { icon: <VideoCall sx={{ fontSize:40, color:'#1565c0' }} />,
    title: 'HD Video Consultations',
    desc: 'Secure WebRTC peer-to-peer video calls with your doctor from anywhere.' },
  { icon: <Security sx={{ fontSize:40, color:'#2e7d32' }} />,
    title: 'AES-256 Encrypted Records',
    desc: 'Your health data is encrypted with military-grade security at all times.' },
  { icon: <Schedule sx={{ fontSize:40, color:'#f57c00' }} />,
    title: 'Smart Scheduling',
    desc: 'Book appointments with real-time slot availability and collision prevention.' },
  { icon: <LocalPharmacy sx={{ fontSize:40, color:'#6a1b9a' }} />,
    title: 'Digital Prescriptions',
    desc: 'QR-verified PDF prescriptions sent directly to you and your pharmacy.' },
];

const STATS = [
  { value: '500+',  label: 'Doctors' },
  { value: '50K+',  label: 'Patients' },
  { value: '99.8%', label: 'Uptime' },
  { value: '4.9★',  label: 'Rating' },
];

// ✅ All hooks and functions MUST be inside the component
export default function LandingPage() {
  const navigate = useNavigate();

  // ✅ useState hooks inside the component
  const [specDialog,   setSpecDialog]   = useState(false);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [specDoctors,  setSpecDoctors]  = useState([]);
  const [loadingDocs,  setLoadingDocs]  = useState(false);

  // ✅ Handler function inside the component
  const handleSpecClick = async (specName) => {
    setSelectedSpec(specName);
    setSpecDialog(true);
    setLoadingDocs(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/appointments/public-doctors?specialization=${encodeURIComponent(specName)}`
      );
      const data = await res.json();
      setSpecDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSpecDoctors([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  return (
    <Box sx={{ minHeight:'100vh', background:'#fff' }}>

      {/* ── Navbar ── */}
      <Box sx={{ position:'sticky', top:0, zIndex:100,
                 background:'rgba(255,255,255,0.95)',
                 backdropFilter:'blur(10px)',
                 borderBottom:'1px solid #e3f2fd',
                 px:{ xs:2, md:8 }, py:1.5,
                 display:'flex', justifyContent:'space-between',
                 alignItems:'center' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
          <MedicalServices sx={{ color:'#1565c0', fontSize:32 }} />
          <Box>
            <Typography variant="h6" fontWeight={800} color="#1565c0"
              lineHeight={1}>
              MediConnect
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Telemedicine Platform
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display:'flex', gap:2, alignItems:'center' }}>
          <Button sx={{ color:'#333', fontWeight:600 }}
            onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="contained"
            onClick={() => navigate('/register')}
            sx={{ borderRadius:3, px:3, background:'#1565c0',
                  fontWeight:700 }}>
            Get Started Free
          </Button>
        </Box>
      </Box>

      {/* ── Hero ── */}
      <Box sx={{
        background:'linear-gradient(135deg,#0d47a1 0%,#1565c0 40%,#1976d2 70%,#42a5f5 100%)',
        color:'white', px:{ xs:3, md:12 },
        py:{ xs:8, md:12 }, position:'relative', overflow:'hidden' }}>

        {[300,500,700].map((size, i) => (
          <Box key={i} sx={{ position:'absolute',
            right:-size/3, top:-size/4,
            width:size, height:size, borderRadius:'50%',
            background:'rgba(255,255,255,0.05)' }} />
        ))}

        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={7}>
            <Chip label="🏥 Trusted by 50,000+ patients"
              sx={{ background:'rgba(255,255,255,0.2)',
                    color:'white', mb:3, fontWeight:600 }} />
            <Typography variant="h2" fontWeight={800} lineHeight={1.15}
              sx={{ fontSize:{ xs:36, md:52 } }}>
              Healthcare at Your
              <Box component="span" sx={{ color:'#90caf9' }}>
                {' '}Fingertips
              </Box>
            </Typography>
            <Typography sx={{ mt:3, mb:4, fontSize:18, opacity:0.9,
                               maxWidth:520, lineHeight:1.7 }}>
              Connect with certified doctors instantly via secure video
              consultation. Book appointments, access your medical records,
              and receive digital prescriptions — all in one platform.
            </Typography>
            <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
              <Button variant="contained" size="large"
                onClick={() => navigate('/register')}
                sx={{ background:'white', color:'#1565c0',
                      fontWeight:800, borderRadius:3, px:4, py:1.5,
                      fontSize:16,
                      '&:hover':{ background:'#e3f2fd' } }}>
                Book a Consultation
              </Button>
              <Button variant="outlined" size="large"
                onClick={() => navigate('/login')}
                sx={{ borderColor:'white', color:'white',
                      fontWeight:700, borderRadius:3, px:4, py:1.5,
                      fontSize:16,
                      '&:hover':{ background:'rgba(255,255,255,0.1)' } }}>
                Sign In
              </Button>
            </Box>
            <Box sx={{ display:'flex', gap:4, mt:5 }}>
              {STATS.map((s, i) => (
                <Box key={i}>
                  <Typography variant="h5" fontWeight={800}>{s.value}</Typography>
                  <Typography variant="body2" sx={{ opacity:0.8 }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p:3, borderRadius:4,
                         background:'rgba(255,255,255,0.12)',
                         backdropFilter:'blur(20px)',
                         border:'1px solid rgba(255,255,255,0.2)' }}>
              <Typography variant="h6" color="white" fontWeight={700} mb={2}>
                🟢 Doctors Available Now
              </Typography>
              {[
                { name:'Dr. Sarah Chen',  spec:'Cardiologist',     wait:'2 min' },
                { name:'Dr. Rajan Kumar', spec:'General Physician', wait:'5 min' },
                { name:'Dr. Priya Menon', spec:'Dermatologist',     wait:'Now' },
              ].map((doc, i) => (
                <Box key={i} sx={{ display:'flex', alignItems:'center',
                                   gap:2, mb:2, p:1.5, borderRadius:2,
                                   background:'rgba(255,255,255,0.1)' }}>
                  <Avatar sx={{ background:'#42a5f5', fontWeight:700 }}>
                    {doc.name[3]}
                  </Avatar>
                  <Box sx={{ flex:1 }}>
                    <Typography color="white" fontWeight={600} variant="body2">
                      {doc.name}
                    </Typography>
                    <Typography color="rgba(255,255,255,0.7)" variant="caption">
                      {doc.spec}
                    </Typography>
                  </Box>
                  <Chip label={`Wait: ${doc.wait}`} size="small"
                    sx={{ background:'#4caf50', color:'white', fontSize:10 }} />
                </Box>
              ))}
              <Button fullWidth variant="contained"
                onClick={() => navigate('/register')}
                sx={{ mt:1, background:'white', color:'#1565c0',
                      fontWeight:700, borderRadius:2 }}>
                See All Doctors →
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* ── Features ── */}
      <Box sx={{ py:10, px:{ xs:3, md:10 }, background:'#f8faff' }}>
        <Box sx={{ textAlign:'center', mb:7 }}>
          <Chip label="WHY CHOOSE US" size="small"
            sx={{ background:'#e3f2fd', color:'#1565c0',
                  fontWeight:700, mb:2 }} />
          <Typography variant="h3" fontWeight={800} color="#1a237e">
            Everything You Need
          </Typography>
          <Typography color="text.secondary" mt={1} fontSize={18}>
            A complete telehealth platform built for modern healthcare
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {FEATURES.map((f, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper sx={{ p:3.5, borderRadius:4, height:'100%',
                           textAlign:'center', border:'1px solid #e3f2fd',
                           transition:'all 0.3s',
                           '&:hover':{ transform:'translateY(-8px)',
                             boxShadow:'0 20px 60px rgba(21,101,192,0.15)',
                             borderColor:'#90caf9' } }}>
                <Box sx={{ mb:2 }}>{f.icon}</Box>
                <Typography variant="h6" fontWeight={700} mb={1}>
                  {f.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                  {f.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Specializations ── */}
      <Box sx={{ py:10, px:{ xs:3, md:10 } }}>
        <Box sx={{ textAlign:'center', mb:7 }}>
          <Chip label="SPECIALIZATIONS" size="small"
            sx={{ background:'#e8f5e9', color:'#2e7d32',
                  fontWeight:700, mb:2 }} />
          <Typography variant="h3" fontWeight={800} color="#1a237e">
            Our Medical Specialties
          </Typography>
          <Typography color="text.secondary" mt={1} fontSize={16}>
            Click on a specialty to see available doctors
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {SPECIALIZATIONS.map((s, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Paper onClick={() => handleSpecClick(s.name)}
                sx={{ p:3, borderRadius:3, textAlign:'center',
                      cursor:'pointer', border:'1px solid #e0e0e0',
                      transition:'all 0.2s',
                      '&:hover':{ borderColor:'#1565c0',
                        background:'#e3f2fd', transform:'scale(1.05)' } }}>
                <Typography fontSize={36}>{s.icon}</Typography>
                <Typography fontWeight={700} variant="body2" mt={1}>
                  {s.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── How It Works ── */}
      <Box sx={{ py:10, px:{ xs:3, md:10 }, background:'#f8faff' }}>
        <Box sx={{ textAlign:'center', mb:7 }}>
          <Typography variant="h3" fontWeight={800} color="#1a237e">
            How It Works
          </Typography>
          <Typography color="text.secondary" mt={1} fontSize={18}>
            Get care in 3 simple steps
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {[
            { step:'01', title:'Create Account',
              desc:'Register as a patient in under 2 minutes. Completely free.',
              color:'#e3f2fd', border:'#90caf9' },
            { step:'02', title:'Book Appointment',
              desc:'Choose your doctor, pick a time slot and confirm instantly.',
              color:'#e8f5e9', border:'#81c784' },
            { step:'03', title:'Consult & Get Prescription',
              desc:'Join the video call, consult your doctor, receive your digital prescription.',
              color:'#fff3e0', border:'#ffb74d' },
          ].map((s, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper sx={{ p:4, borderRadius:4, textAlign:'center',
                           background:s.color, border:`2px solid ${s.border}` }}>
                <Typography variant="h2" fontWeight={900}
                  color={s.border} sx={{ opacity:0.4 }}>
                  {s.step}
                </Typography>
                <Typography variant="h6" fontWeight={700} mt={1}>
                  {s.title}
                </Typography>
                <Typography color="text.secondary" mt={1} lineHeight={1.7}>
                  {s.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── CTA ── */}
      <Box sx={{ py:10, px:{ xs:3, md:10 },
                 background:'linear-gradient(135deg,#1565c0,#0d47a1)',
                 textAlign:'center', color:'white' }}>
        <Typography variant="h3" fontWeight={800} mb={2}>
          Ready to Get Started?
        </Typography>
        <Typography fontSize={18} sx={{ opacity:0.9, mb:4 }}>
          Join thousands of patients who trust MediConnect for their healthcare
        </Typography>
        <Box sx={{ display:'flex', gap:2, justifyContent:'center',
                   flexWrap:'wrap' }}>
          <Button variant="contained" size="large"
            onClick={() => navigate('/register')}
            sx={{ background:'white', color:'#1565c0', fontWeight:800,
                  borderRadius:3, px:5, py:1.5, fontSize:16,
                  '&:hover':{ background:'#e3f2fd' } }}>
            Register as Patient
          </Button>
          <Button variant="outlined" size="large"
            onClick={() => navigate('/register')}
            sx={{ borderColor:'white', color:'white', fontWeight:700,
                  borderRadius:3, px:5, py:1.5, fontSize:16,
                  '&:hover':{ background:'rgba(255,255,255,0.1)' } }}>
            Join as Doctor
          </Button>
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ background:'#0d1b2a', color:'white',
                 px:{ xs:3, md:10 }, py:6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
              <MedicalServices sx={{ color:'#42a5f5' }} />
              <Typography variant="h6" fontWeight={800}>MediConnect</Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity:0.6, lineHeight:1.8 }}>
              A secure, HIPAA-compliant telemedicine platform connecting
              patients with certified doctors worldwide.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography fontWeight={700} mb={2}>Platform</Typography>
            {['For Patients','For Doctors','For Clinics','Pricing'].map(l => (
              <Typography key={l} variant="body2"
                sx={{ opacity:0.6, mb:1, cursor:'pointer',
                      '&:hover':{ opacity:1 } }}>
                {l}
              </Typography>
            ))}
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography fontWeight={700} mb={2}>Company</Typography>
            {['About Us','Blog','Careers','Press'].map(l => (
              <Typography key={l} variant="body2"
                sx={{ opacity:0.6, mb:1, cursor:'pointer',
                      '&:hover':{ opacity:1 } }}>
                {l}
              </Typography>
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography fontWeight={700} mb={2}>Contact</Typography>
            {[
              { icon:<Phone fontSize="small"/>, text:'+91 1800-MED-CARE' },
              { icon:<Email fontSize="small"/>, text:'support@mediconnect.in' },
              { icon:<LocationOn fontSize="small"/>, text:'Chennai, Tamil Nadu' },
            ].map((c, i) => (
              <Box key={i} sx={{ display:'flex', gap:1, mb:1.5, opacity:0.7 }}>
                {c.icon}
                <Typography variant="body2">{c.text}</Typography>
              </Box>
            ))}
          </Grid>
        </Grid>
        <Box sx={{ mt:5, pt:3,
                   borderTop:'1px solid rgba(255,255,255,0.1)',
                   display:'flex', justifyContent:'space-between',
                   flexWrap:'wrap', gap:2 }}>
          <Typography variant="body2" sx={{ opacity:0.5 }}>
            © 2026 MediConnect. All rights reserved.
          </Typography>
          <Box sx={{ display:'flex', gap:3 }}>
            {['Privacy Policy','Terms of Service','HIPAA Compliance'].map(l => (
              <Typography key={l} variant="body2"
                sx={{ opacity:0.5, cursor:'pointer',
                      '&:hover':{ opacity:1 } }}>
                {l}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Specialization Doctor Dialog ── */}
      <Dialog open={specDialog}
        onClose={() => setSpecDialog(false)}
        maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display:'flex', justifyContent:'space-between',
                     alignItems:'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {selectedSpec} Specialists
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available doctors for consultation
              </Typography>
            </Box>
            <Button onClick={() => setSpecDialog(false)}
              sx={{ minWidth:'auto', p:1 }}>
              <Close />
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent>
          {loadingDocs ? (
            <Box sx={{ textAlign:'center', py:4 }}>
              <Typography color="text.secondary">Loading doctors...</Typography>
            </Box>
          ) : specDoctors.length === 0 ? (
            <Box sx={{ textAlign:'center', py:4 }}>
              <Typography fontSize={48}>🩺</Typography>
              <Typography fontWeight={700} mt={1}>
                No doctors available yet
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Check back soon or explore other specializations
              </Typography>
            </Box>
          ) : (
            specDoctors.map((doc, i) => (
              <Box key={doc._id}>
                <Box sx={{ display:'flex', alignItems:'center',
                           gap:2, py:2 }}>
                  <Avatar sx={{ width:56, height:56,
                                background:'#1565c0',
                                fontSize:22, fontWeight:700 }}>
                    {doc.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex:1 }}>
                    <Typography fontWeight={700}>Dr. {doc.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      🏥 {doc.specialization}
                    </Typography>
                    <Box sx={{ display:'flex', gap:1, mt:0.5 }}>
                      <Chip icon={<CheckCircle sx={{ fontSize:14 }} />}
                        label="Verified Doctor" size="small" color="success"
                        sx={{ height:20, fontSize:10 }} />
                      <Chip label="30-min slots" size="small"
                        sx={{ height:20, fontSize:10,
                              background:'#e3f2fd', color:'#1565c0' }} />
                    </Box>
                  </Box>
                  <Button variant="contained" size="small"
                    onClick={() => { setSpecDialog(false); navigate('/register'); }}
                    sx={{ borderRadius:2, background:'#1565c0',
                          whiteSpace:'nowrap' }}>
                    Book Now
                  </Button>
                </Box>
                {i < specDoctors.length - 1 && <Divider />}
              </Box>
            ))
          )}
        </DialogContent>

        <DialogActions sx={{ p:2.5 }}>
          <Button onClick={() => setSpecDialog(false)}>Close</Button>
          <Button variant="contained"
            onClick={() => { setSpecDialog(false); navigate('/register'); }}
            sx={{ borderRadius:2, background:'#1565c0' }}>
            Register to Book Appointment
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}