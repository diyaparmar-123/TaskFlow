require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// ✅ ROOT ROUTE (IMPORTANT)
app.get('/', (req, res) => {
  res.send('TaskFlow API is running 🚀');
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// ✅ DO NOT CRASH SERVER
initDB()
  .then(() => {
    console.log("✅ DB connected");
  })
  .catch(err => {
    console.error("❌ DB connection failed:", err.message);
  });

// 🚀 ALWAYS START SERVER (IMPORTANT)
app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API running on port ${PORT}`);
});