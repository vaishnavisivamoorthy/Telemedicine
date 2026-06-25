import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Box, Button, Typography, Paper, IconButton, Chip } from '@mui/material';
import {
  Mic, MicOff, Videocam, VideocamOff,
  CallEnd, FiberManualRecord
} from '@mui/icons-material';

const SIGNAL_URL = import.meta.env.VITE_SIGNAL_URL || 'http://localhost:5001';
const ROOM_ID     = 'test-room-001';
const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export default function VideoRoom() {
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const pcRef             = useRef(null);
  const socketRef         = useRef(null);
  const localStreamRef    = useRef(null);

  const [micOn,    setMicOn]    = useState(true);
  const [camOn,    setCamOn]    = useState(true);
  const [connected, setConnected] = useState(false);
  const [status,   setStatus]   = useState('Connecting...');

  useEffect(() => {
    startCall();
    return () => cleanup();
  }, []);

  const startCall = async () => {
    try {
      // Get local camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true, audio: true
      });
      localStreamRef.current     = stream;
      localVideoRef.current.srcObject = stream;

      // Connect to signaling server
      socketRef.current = io(SIGNAL_URL);

      socketRef.current.on('connect', () => {
        setStatus('Connected to server');
        socketRef.current.emit('join-room', {
          roomId: ROOM_ID, userName: user?.name
        });
      });

      // Another user joined — create offer
      socketRef.current.on('user-joined', async ({ userId }) => {
        setStatus('Peer found — establishing connection...');
        await createPeerConnection(stream, userId);
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socketRef.current.emit('offer', {
          roomId: ROOM_ID, offer, to: userId
        });
      });

      // Received offer — send answer
      socketRef.current.on('offer', async ({ offer, from }) => {
        await createPeerConnection(stream, from);
        await pcRef.current.setRemoteDescription(offer);
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socketRef.current.emit('answer', { answer, to: from });
      });

      // Received answer
      socketRef.current.on('answer', async ({ answer }) => {
        await pcRef.current.setRemoteDescription(answer);
      });

      // ICE candidate received
      socketRef.current.on('ice-candidate', async ({ candidate }) => {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(candidate);
        }
      });

      // Peer left
      socketRef.current.on('user-left', () => {
        setStatus('Peer disconnected');
        setConnected(false);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });

      setStatus('Waiting for other participant...');

    } catch (err) {
      console.error('Camera error:', err);
      setStatus('Camera/mic access denied. Please allow permissions.');
    }
  };

  const createPeerConnection = async (stream, peerId) => {
    pcRef.current = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    stream.getTracks().forEach(track =>
      pcRef.current.addTrack(track, stream)
    );

    // ICE candidate generated
    pcRef.current.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current.emit('ice-candidate', {
          candidate, to: peerId
        });
      }
    };

    // Remote stream received
    pcRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
      setConnected(true);
      setStatus('Connected — Live consultation');
    };
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current
      ?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks()
      .forEach(t => t.stop());
    pcRef.current?.close();
    socketRef.current?.disconnect();
  };

  const endCall = () => {
    cleanup();
    navigate(-1);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0a0a0a',
               display: 'flex', flexDirection: 'column',
               alignItems: 'center', justifyContent: 'center', p: 2 }}>

      {/* Status bar */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiberManualRecord sx={{ color: connected ? '#4caf50' : '#ff9800',
                                  fontSize: 14 }} />
        <Typography color="white" variant="body2">{status}</Typography>
        {connected && <Chip label="LIVE" size="small"
          sx={{ background: '#f44336', color: 'white',
                fontWeight: 700, fontSize: 10 }} />}
      </Box>

      {/* Video Grid */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap',
                 justifyContent: 'center' }}>

        {/* Remote Video */}
        <Paper sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden',
                     background: '#1a1a2e', width: 640, height: 400 }}>
          <video ref={remoteVideoRef} autoPlay playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {!connected && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex',
                       alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="white" opacity={0.5}>
                Waiting for participant...
              </Typography>
            </Box>
          )}
          <Typography sx={{ position: 'absolute', bottom: 12, left: 12,
                            color: 'white', fontSize: 12,
                            background: 'rgba(0,0,0,0.5)',
                            px: 1, borderRadius: 1 }}>
            Remote
          </Typography>
        </Paper>

        {/* Local Video */}
        <Paper sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden',
                     background: '#1a1a2e', width: 300, height: 200 }}>
          <video ref={localVideoRef} autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <Typography sx={{ position: 'absolute', bottom: 8, left: 8,
                            color: 'white', fontSize: 12,
                            background: 'rgba(0,0,0,0.5)',
                            px: 1, borderRadius: 1 }}>
            You ({user?.name})
          </Typography>
        </Paper>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <IconButton onClick={toggleMic}
          sx={{ background: micOn ? '#333' : '#f44336',
                color: 'white', p: 2,
                '&:hover': { background: micOn ? '#555' : '#d32f2f' } }}>
          {micOn ? <Mic /> : <MicOff />}
        </IconButton>

        <IconButton onClick={toggleCam}
          sx={{ background: camOn ? '#333' : '#f44336',
                color: 'white', p: 2,
                '&:hover': { background: camOn ? '#555' : '#d32f2f' } }}>
          {camOn ? <Videocam /> : <VideocamOff />}
        </IconButton>

        <IconButton onClick={endCall}
          sx={{ background: '#f44336', color: 'white',
                p: 2.5, mx: 1,
                '&:hover': { background: '#d32f2f' } }}>
          <CallEnd sx={{ fontSize: 30 }} />
        </IconButton>
      </Box>

      <Typography color="grey.600" variant="caption" mt={2}>
        Room: {ROOM_ID}
      </Typography>
    </Box>
  );
}