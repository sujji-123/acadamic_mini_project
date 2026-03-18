import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mobileOTP: {
    code: String,
    expiresAt: Date,
    verified: { type: Boolean, default: false }
  },
  emailOTP: {
    code: String,
    expiresAt: Date,
    verified: { type: Boolean, default: false }
  },
  hospitalVerification: {
    hospitalName: String,
    hospitalRegNo: String,
    doctorName: String,
    doctorLicense: String,
    verified: { type: Boolean, default: false },
    documents: [String]
  },
  mlVerificationScore: {
    score: Number,
    isFake: Boolean,
    reasons: [String]
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'partial', 'verified', 'rejected'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Verification = mongoose.model('Verification', verificationSchema);