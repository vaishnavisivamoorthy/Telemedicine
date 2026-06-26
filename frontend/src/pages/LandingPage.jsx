import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Paper, Avatar,
  Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, CircularProgress
} from '@mui/material';
import {
  MedicalServices, VideoCall, Security, Schedule,
  LocalPharmacy, Phone, Email, LocationOn,
  CheckCircle, Close, ArrowForward
} from '@mui/icons-material';

const SPECIALIZATIONS = [
  { name:'Cardiology',      icon:'❤️',  desc:'Heart & cardiovascular care',  color:'#ffebee', border:'#ef9a9a' },
  { name:'Neurology',       icon:'🧠',  desc:'Brain & nervous system',       color:'#ede7f6', border:'#b39ddb' },
  { name:'Dermatology',     icon:'✨',  desc:'Skin conditions & care',       color:'#fce4ec', border:'#f48fb1' },
  { name:'Pediatrics',      icon:'👶',  desc:'Children health care',         color:'#e3f2fd', border:'#90caf9' },
  { name:'Orthopedics',     icon:'🦴',  desc:'Bones & joints',               color:'#fff8e1', border:'#ffe082' },
  { name:'General Physician',icon:'🩺', desc:'General medicine',             color:'#e8f5e9', border:'#a5d6a7' },
  { name:'Gynecologist',    icon:'🌸',  desc:'Women\'s health',              color:'#fce4ec', border:'#f06292' },
  { name:'Psychiatrist',    icon:'🧘',  desc:'Mental health care',           color:'#e8eaf6', border:'#9fa8da' },
];

const FEATURES = [
  { icon:<VideoCall sx={{ fontSize:40, color:'#1565c0' }} />,
    title:'HD Video Consultations',
    desc:'Secure WebRTC peer-to-peer video calls with your doctor from anywhere.' },
  { icon:<Security sx={{ fontSize:40, color:'#2e7d32' }} />,
    title:'AES-256 Encrypted Records',
    desc:'Your health data is encrypted with military-grade security at all times.' },
  { icon:<Schedule sx={{ fontSize:40, color:'#f57c00' }} />,
    title:'Smart Scheduling',
    desc:'Book appointments with real-time slot availability and collision prevention.' },
  { icon:<LocalPharmacy sx={{ fontSize:40, color:'#6a1b9a' }} />,
    title:'Digital Prescriptions',
    desc:'QR-verified PDF prescriptions sent directly to you and your pharmacy.' },
];

const STATS = [
  { value:'500+',  label:'Doctors' },
  { value:'50K+',  label:'Patients' },
  { value:'99.8%', label:'Uptime' },
  { value:'4.9★',  label:'Rating' },
];

const FOOTER_LINKS = {
  Platform: [
    { label:'For Patients',  path:'/register' },
    { label:'For Doctors',   path:'/register' },
    { label:'Book Appointment', path:'/register' },
    { label:'Video Consult', path:'/register' },
  ],
  Company: [
    { label:'About Us',   path:'/' },
    { label:'Blog',       path:'/' },
    { label:'Careers',    path:'/' },
    { label:'Contact',    path:'/' },
  ],
  Legal: [
    { label:'Privacy Policy',    path:'/' },
    { label:'Terms of Service',  path:'/' },
    { label:'HIPAA Compliance',  path:'/' },
    { label:'Cookie Policy',     path:'/' },
  ],
};

export default function LandingPage() {
  const navigate = useNavigate();

  const [specDialog,    setSpecDialog]    = useState(false);
  const [selectedSpec,  setSelectedSpec]  = useState('');
  const [specDoctors,   setSpecDoctors]   = useState([]);
  const [loadingDocs,   setLoadingDocs]   = useState(false);
  const [specError,     setSpecError]     = useState('');

  const handleSpecClick = async (specName) => {
    setSelectedSpec(specName);
    setSpecDialog(true);
    setLoadingDocs(true);
    setSpecError('');
    setSpecDoctors([]);
    try {
      const res = await fetch(
  `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/appointments/public-doctors?specialization=${encodeURIComponent(specName)}`
);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setSpecDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSpecError('Could not load doctors. Please try again.');
      setSpecDoctors([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  return (
    <Box sx={{ minHeight:'100vh', background:'#fff' }}>

      {/* ── Navbar ── */}
      <Box sx={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(255,255,255,0.97)',
        backdropFilter:'blur(12px)',
        borderBottom:'1px solid #e3f2fd',
        px:{ xs:2, md:8 }, py:1.5,
        display:'flex', justifyContent:'space-between',
        alignItems:'center',
        boxShadow:'0 2px 20px rgba(21,101,192,0.08)'
      }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5,
                   cursor:'pointer' }}
          onClick={() => navigate('/')}>
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
          <Button sx={{ color:'#1565c0', fontWeight:600 }}
            onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="contained"
            onClick={() => navigate('/register')}
            sx={{ borderRadius:3, px:3, background:'#1565c0',
                  fontWeight:700,
                  '&:hover':{ background:'#0d47a1' } }}>
            Get Started Free
          </Button>
        </Box>
      </Box>

      {/* ── Hero ── */}
      <Box sx={{
        background:'linear-gradient(135deg,#0d47a1 0%,#1565c0 40%,#1976d2 70%,#42a5f5 100%)',
        color:'white', px:{ xs:3, md:12 },
        py:{ xs:8, md:12 }, position:'relative', overflow:'hidden'
      }}>
        {[300,500,700].map((size, i) => (
          <Box key={i} sx={{
            position:'absolute', right:-size/3, top:-size/4,
            width:size, height:size, borderRadius:'50%',
            background:'rgba(255,255,255,0.05)'
          }} />
        ))}

        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={7}>
            <Chip label="🏥 Trusted by 50,000+ patients"
              sx={{ background:'rgba(255,255,255,0.2)',
                    color:'white', mb:3, fontWeight:600 }} />
            <Typography variant="h2" fontWeight={800} lineHeight={1.15}
              sx={{ fontSize:{ xs:32, md:52 } }}>
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
            <Box sx={{ display:'flex', gap:4, mt:5, flexWrap:'wrap' }}>
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
              <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
                <Box sx={{ width:10, height:10, borderRadius:'50%',
                           background:'#4caf50',
                           boxShadow:'0 0 0 3px rgba(76,175,80,0.3)' }} />
                <Typography variant="h6" color="white" fontWeight={700}>
                  Doctors Available Now
                </Typography>
              </Box>
              {[
                { name:'Dr. Sarah Chen',  spec:'Cardiologist',      wait:'2 min' },
                { name:'Dr. Rajan Kumar', spec:'General Physician',  wait:'5 min' },
                { name:'Dr. Priya Menon', spec:'Dermatologist',      wait:'Now' },
              ].map((doc, i) => (
                <Box key={i} sx={{ display:'flex', alignItems:'center',
                                   gap:2, mb:2, p:1.5, borderRadius:2,
                                   background:'rgba(255,255,255,0.1)',
                                   transition:'all 0.2s',
                                   '&:hover':{ background:'rgba(255,255,255,0.18)' } }}>
                  <Avatar sx={{ background:'#42a5f5', fontWeight:700,
                                width:40, height:40 }}>
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
                      fontWeight:700, borderRadius:2,
                      '&:hover':{ background:'#e3f2fd' } }}>
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
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Paper
                onClick={() => handleSpecClick(s.name)}
                elevation={0}
                sx={{ p:3, borderRadius:3, textAlign:'center',
                      cursor:'pointer',
                      border:`2px solid ${s.border}`,
                      background:s.color,
                      transition:'all 0.25s',
                      '&:hover':{ transform:'translateY(-6px)',
                        boxShadow:`0 12px 40px ${s.border}66`,
                        border:`2px solid ${s.border}` } }}>
                <Typography fontSize={42}>{s.icon}</Typography>
                <Typography fontWeight={700} variant="body1" mt={1}>
                  {s.name}
                </Typography>
                <Typography variant="caption" color="text.secondary"
                  display="block" mt={0.5}>
                  {s.desc}
                </Typography>
                <Chip label="View Doctors →" size="small"
                  sx={{ mt:1.5, background:'rgba(255,255,255,0.8)',
                        fontSize:10, cursor:'pointer' }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── How It Works ── */}
      <Box sx={{ py:10, px:{ xs:3, md:10 }, background:'#f8faff' }}>
        <Box sx={{ textAlign:'center', mb:7 }}>
          <Chip label="HOW IT WORKS" size="small"
            sx={{ background:'#fff3e0', color:'#e65100',
                  fontWeight:700, mb:2 }} />
          <Typography variant="h3" fontWeight={800} color="#1a237e">
            Get Care in 3 Steps
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {[
            { step:'01', title:'Create Account',
              desc:'Register as a patient in under 2 minutes. Completely free.',
              color:'#e3f2fd', border:'#90caf9', icon:'👤' },
            { step:'02', title:'Book Appointment',
              desc:'Choose your doctor by specialization, pick a time slot and confirm.',
              color:'#e8f5e9', border:'#81c784', icon:'📅' },
            { step:'03', title:'Consult & Prescriptions',
              desc:'Video call your doctor and receive a verified digital prescription.',
              color:'#fff3e0', border:'#ffb74d', icon:'💊' },
          ].map((s, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Paper sx={{ p:4, borderRadius:4, textAlign:'center',
                           background:s.color,
                           border:`2px solid ${s.border}`,
                           position:'relative', overflow:'hidden' }}>
                <Typography fontSize={48}>{s.icon}</Typography>
                <Typography variant="h2" fontWeight={900}
                  sx={{ position:'absolute', top:8, right:16,
                        opacity:0.12, fontSize:80, color:s.border }}>
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
            sx={{ background:'white', color:'#1565c0',
                  fontWeight:800, borderRadius:3, px:5, py:1.5,
                  fontSize:16,
                  '&:hover':{ background:'#e3f2fd' } }}>
            Register as Patient
          </Button>
          <Button variant="outlined" size="large"
            onClick={() => navigate('/register')}
            sx={{ borderColor:'white', color:'white',
                  fontWeight:700, borderRadius:3, px:5, py:1.5,
                  fontSize:16,
                  '&:hover':{ background:'rgba(255,255,255,0.1)' } }}>
            Join as Doctor
          </Button>
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ background:'#0d1b2a', color:'white',
                 px:{ xs:3, md:10 }, py:8 }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
              <MedicalServices sx={{ color:'#42a5f5', fontSize:28 }} />
              <Typography variant="h6" fontWeight={800}>MediConnect</Typography>
            </Box>
            <Typography variant="body2"
              sx={{ opacity:0.6, lineHeight:2, maxWidth:300 }}>
              A secure, HIPAA-compliant telemedicine platform connecting
              patients with certified doctors worldwide.
            </Typography>
            <Box sx={{ display:'flex', gap:1.5, mt:3 }}>
              {['📘','📸','🐦','💼'].map((icon, i) => (
                <Box key={i}
                  sx={{ width:36, height:36, borderRadius:'50%',
                        background:'rgba(255,255,255,0.1)',
                        display:'flex', alignItems:'center',
                        justifyContent:'center', cursor:'pointer',
                        fontSize:16,
                        '&:hover':{ background:'rgba(255,255,255,0.2)' } }}>
                  {icon}
                </Box>
              ))}
            </Box>
          </Grid>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <Grid item xs={6} md={2} key={section}>
              <Typography fontWeight={700} mb={2.5} fontSize={15}>
                {section}
              </Typography>
              {links.map(link => (
                <Typography key={link.label} variant="body2"
                  onClick={() => navigate(link.path)}
                  sx={{ opacity:0.6, mb:1.5, cursor:'pointer',
                        display:'flex', alignItems:'center', gap:0.5,
                        transition:'all 0.2s',
                        '&:hover':{ opacity:1, color:'#90caf9',
                                    transform:'translateX(4px)' } }}>
                  {link.label}
                </Typography>
              ))}
            </Grid>
          ))}

          <Grid item xs={12} md={2}>
            <Typography fontWeight={700} mb={2.5} fontSize={15}>
              Contact
            </Typography>
            {[
              { icon:<Phone fontSize="small"/>, text:'+91 1800-MED-CARE' },
              { icon:<Email fontSize="small"/>, text:'support@mediconnect.in' },
              { icon:<LocationOn fontSize="small"/>, text:'Chennai, Tamil Nadu' },
            ].map((c, i) => (
              <Box key={i} sx={{ display:'flex', gap:1.5, mb:2,
                                 opacity:0.6,
                                 '&:hover':{ opacity:1 } }}>
                <Box sx={{ color:'#90caf9', mt:0.2 }}>{c.icon}</Box>
                <Typography variant="body2" lineHeight={1.5}>
                  {c.text}
                </Typography>
              </Box>
            ))}
          </Grid>
        </Grid>

        <Divider sx={{ my:4, borderColor:'rgba(255,255,255,0.1)' }} />

        <Box sx={{ display:'flex', justifyContent:'space-between',
                   flexWrap:'wrap', gap:2, alignItems:'center' }}>
          <Typography variant="body2" sx={{ opacity:0.5 }}>
            © 2026 MediConnect. All rights reserved.
          </Typography>
          <Box sx={{ display:'flex', gap:3 }}>
            {['Privacy Policy','Terms of Service','HIPAA Compliance'].map(l => (
              <Typography key={l} variant="body2"
                onClick={() => navigate('/')}
                sx={{ opacity:0.5, cursor:'pointer',
                      '&:hover':{ opacity:1, color:'#90caf9' } }}>
                {l}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Specialization Doctor Dialog ── */}
      <Dialog open={specDialog}
        onClose={() => setSpecDialog(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ pb:1 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between',
                     alignItems:'flex-start' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {selectedSpec} Specialists
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available doctors for online consultation
              </Typography>
            </Box>
            <Button onClick={() => setSpecDialog(false)}
              sx={{ minWidth:'auto', p:0.5, mt:-0.5 }}>
              <Close />
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt:1 }}>
          {loadingDocs ? (
            <Box sx={{ textAlign:'center', py:6 }}>
              <CircularProgress size={40} />
              <Typography color="text.secondary" mt={2}>
                Finding available doctors...
              </Typography>
            </Box>
          ) : specError ? (
            <Box sx={{ textAlign:'center', py:4 }}>
              <Typography fontSize={48}>⚠️</Typography>
              <Typography fontWeight={700} mt={1} color="error">
                {specError}
              </Typography>
            </Box>
          ) : specDoctors.length === 0 ? (
            <Box sx={{ textAlign:'center', py:5 }}>
              <Typography fontSize={52}>🩺</Typography>
              <Typography fontWeight={700} mt={2} variant="h6">
                No doctors listed yet
              </Typography>
              <Typography color="text.secondary" variant="body2" mt={1}>
                Our admin is adding {selectedSpec} specialists soon.
                Register now to get notified!
              </Typography>
              <Button variant="contained" sx={{ mt:3, borderRadius:2 }}
                onClick={() => { setSpecDialog(false); navigate('/register'); }}>
                Register & Get Notified
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {specDoctors.length} doctor{specDoctors.length > 1 ? 's' : ''} available
              </Typography>
              {specDoctors.map((doc, i) => (
                <Box key={doc._id}>
                  <Box sx={{ display:'flex', alignItems:'center',
                             gap:2.5, py:2.5 }}>
                    <Avatar sx={{ width:60, height:60,
                                  background:'linear-gradient(135deg,#1565c0,#42a5f5)',
                                  fontSize:24, fontWeight:700 }}>
                      {doc.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex:1 }}>
                      <Typography fontWeight={700} variant="body1">
                        Dr. {doc.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🏥 {doc.specialization}
                      </Typography>
                      <Box sx={{ display:'flex', gap:1, mt:1,
                                 flexWrap:'wrap' }}>
                        <Chip icon={<CheckCircle sx={{ fontSize:12 }} />}
                          label="Verified" size="small" color="success"
                          sx={{ height:22, fontSize:10 }} />
                        <Chip label="30-min slots" size="small"
                          sx={{ height:22, fontSize:10,
                                background:'#e3f2fd', color:'#1565c0' }} />
                        <Chip label="Available today" size="small"
                          sx={{ height:22, fontSize:10,
                                background:'#e8f5e9', color:'#2e7d32' }} />
                      </Box>
                    </Box>
                    <Button variant="contained" size="small"
                      endIcon={<ArrowForward />}
                      onClick={() => {
                        setSpecDialog(false);
                        navigate('/register');
                      }}
                      sx={{ borderRadius:2, background:'#1565c0',
                            whiteSpace:'nowrap', px:2,
                            '&:hover':{ background:'#0d47a1' } }}>
                      Book Now
                    </Button>
                  </Box>
                  {i < specDoctors.length - 1 && (
                    <Divider sx={{ opacity:0.5 }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p:2.5, pt:1,
                             borderTop:'1px solid #f0f0f0' }}>
          <Button onClick={() => setSpecDialog(false)}
            sx={{ color:'#666' }}>
            Close
          </Button>
          <Button variant="contained"
            onClick={() => { setSpecDialog(false); navigate('/register'); }}
            sx={{ borderRadius:2, background:'#1565c0', px:3,
                  '&:hover':{ background:'#0d47a1' } }}>
            Register to Book
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}