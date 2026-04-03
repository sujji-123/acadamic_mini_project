import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Common fields for all users
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  userType: {
    type: String,
    // FIX: Added 'hospital' to the enum to support the Organ Transplant Network
    enum: ['individual_donor', 'paid_donor', 'blood_bank', 'patient', 'hospital'],
    required: true
  },
  location: {
    address: String,
    city: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Current live location for tracking
  currentLocation: {
    lat: Number,
    lng: Number,
    timestamp: Date
  },
  
  // Donor specific fields (for individual_donor and paid_donor)
  donorDetails: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    age: {
      type: Number,
      min: 18,
      max: 65
    },
    weight: {
      type: Number,
      min: 45
    },
    hemoglobin: {
      type: Number,
      min: 12.5
    },
    diseases: [String],
    lastDonationDate: Date,
    isAvailable: {
      type: Boolean,
      default: true
    },
    donationCount: {
      type: Number,
      default: 0
    },
    // For paid donors
    expectedAmount: Number,
    
    // Eligibility score (will be calculated by ML later)
    eligibilityScore: {
      type: Number,
      default: 0
    }
  },
  
  // Blood bank specific fields
  bloodBankDetails: {
    registrationNumber: String,
    licenseNumber: String,
    establishedYear: Number,
    totalUnitsAvailable: {
      'A+': { type: Number, default: 0 },
      'A-': { type: Number, default: 0 },
      'B+': { type: Number, default: 0 },
      'B-': { type: Number, default: 0 },
      'O+': { type: Number, default: 0 },
      'O-': { type: Number, default: 0 },
      'AB+': { type: Number, default: 0 },
      'AB-': { type: Number, default: 0 }
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  
  // Patient specific fields
  patientDetails: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    urgencyLevel: {
      type: String,
      enum: ['normal', 'urgent', 'emergency'],
      default: 'normal'
    },
    age: Number,
    medicalReports: [String] // URLs to uploaded reports
  },

  // Verification & Spam Detection Fields
  isVerified: {
    type: Boolean,
    default: false
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  verificationFlags: {
    type: [String],
    default: []
  },
  verificationConfidence: {
    type: Number,
    default: 0
  },
  verificationDate: Date,
  
  // Social Links for verification
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String
  },

  // Common tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: Date,
  registeredAt: Date
});

// Index for better query performance
userSchema.index({ userType: 1, 'donorDetails.bloodGroup': 1 });
userSchema.index({ isSpam: 1 });
userSchema.index({ location: '2dsphere' });

// Donation history schema (separate collection)
const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bloodGroup: String,
  units: Number,
  donationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'pending'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['voluntary', 'paid']
  },
  amount: Number, // for paid donations
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest'
  }
});

// Location history schema
const locationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lat: Number,
  lng: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

locationHistorySchema.index({ userId: 1, timestamp: -1 });

export const User = mongoose.model('User', userSchema);
export const Donation = mongoose.model('Donation', donationSchema);
export const LocationHistory = mongoose.model('LocationHistory', locationHistorySchema);