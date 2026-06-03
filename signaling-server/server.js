const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());

// Track users in rooms
const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a video room
  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, userName });

    // Notify others in the room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id, userName
    });

    console.log(`${userName} joined room: ${roomId}`);
  });

  // WebRTC signaling: forward offer to other peer
  socket.on('offer', ({ roomId, offer, to }) => {
    socket.to(to).emit('offer', {
      offer, from: socket.id
    });
  });

  // WebRTC signaling: forward answer to other peer
  socket.on('answer', ({ answer, to }) => {
    socket.to(to).emit('answer', {
      answer, from: socket.id
    });
  });

  // ICE candidates: forward to other peer
  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', {
      candidate, from: socket.id
    });
  });

  // User leaves room
  socket.on('leave-room', ({ roomId }) => {
    socket.to(roomId).emit('user-left', { userId: socket.id });
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(u => u.id !== socket.id);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in rooms) {
      const user = rooms[roomId].find(u => u.id === socket.id);
      if (user) {
        socket.to(roomId).emit('user-left', { userId: socket.id });
        rooms[roomId] = rooms[roomId].filter(u => u.id !== socket.id);
      }
    }
  });
});

server.listen(5001, () => {
  console.log('🎥 Signaling server running on port 5001');
});