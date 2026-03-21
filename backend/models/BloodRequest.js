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
    enum: ['pending', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  // The donor who accepts the request
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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