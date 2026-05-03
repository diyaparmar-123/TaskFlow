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

initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 TaskFlow API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to init DB:', err);
    process.exit(1);
  });
