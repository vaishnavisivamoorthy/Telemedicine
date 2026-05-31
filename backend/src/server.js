const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const auditLog = require('./middleware/auditLog');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(auditLog);   // logs every request

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ DB Error:', err));

// Routes (add as you build them)
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/patients',     require('./routes/patients'));
// app.use('/api/appointments', require('./routes/appointments'));

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});