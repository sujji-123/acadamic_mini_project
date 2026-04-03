import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'emergency'
  },
  status: {
    type: String,
    // FIX 1: Added 'completed' to the enum so the "Mark Complete" button works without crashing
    enum: ['pending', 'fulfilled', 'cancelled', 'completed'],
    default: 'pending'
  },
  // The donor who accepts the request (Original)
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // FIX 2: Added acceptedDonorId. Our new routes use this to populate the tracking UI!
  acceptedDonorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // FIX 3: Added acceptedAt to record exactly when the donor clicked yes
  acceptedAt: {
    type: Date
  },
  // FIX 4: Added location object to store the GPS coordinates for the map tracking
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  // Keep track of who we sent SMS to
  notifiedDonors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);