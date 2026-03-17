import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Common fields for all users
  name: {
    type: String,
    required: true,
    trim: true
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
    required: true
  },
  userType: {
    type: String,
    enum: ['individual_donor', 'paid_donor', 'blood_bank', 'patient'],
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
  
  // Donor specific fields (for individual_donor and paid_donor)
  donorDetails: {
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    age: Number,
    weight: Number,
    hemoglobin: Number,
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
      'A+': Number,
      'A-': Number,
      'B+': Number,
      'B-': Number,
      'O+': Number,
      'O-': Number,
      'AB+': Number,
      'AB-': Number
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
      enum: ['normal', 'urgent', 'emergency']
    },
    medicalReports: [String] // URLs to uploaded reports
  },

  // Common tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: Date,
  isVerified: {
    type: Boolean,
    default: false
  }
});

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
  amount: Number // for paid donations
});

export const User = mongoose.model('User', userSchema);
export const Donation = mongoose.model('Donation', donationSchema);