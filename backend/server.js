import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import verificationRoutes from './routes/verification.js';
import donorRoutes from './routes/donors.js';
// FIXED: Changed from requests.js to request.js to match your file system exactly
import requestRoutes from './routes/request.js';
import { whatsappClient } from './services/whatsappService.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Initialize WhatsApp Bot
whatsappClient.initialize();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Blood Donor API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});