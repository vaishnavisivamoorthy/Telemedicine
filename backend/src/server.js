require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    // TEMPORARILY COMMENTED OUT
    // const auditLog = require('./middleware/auditLog');
    // app.use(auditLog);

    app.use('/api/auth',         require('./routes/auth'));
    app.use('/api/patients',     require('./routes/patients'));
    app.use('/api/appointments', require('./routes/appointments'));
    app.use('/api/prescriptions', require('./routes/prescriptions'));
    app.use('/api/admin', require('./routes/admin'));
    
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('❌ DB Error:', err));