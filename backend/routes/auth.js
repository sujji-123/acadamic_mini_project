import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router();

// ML Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Helper function to calculate email domain score
const calculateEmailDomainScore = (email) => {
  const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'yopmail.com', 'throwaway.com'];
  const domain = email.split('@')[1]?.toLowerCase() || '';
  
  if (suspiciousDomains.includes(domain)) {
    return 0.1;
  } else if (domain.endsWith('.edu')) {
    return 1.0;
  } else if (domain.endsWith('.gov')) {
    return 1.0;
  } else if (['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain)) {
    return 0.8;
  } else {
    return 0.5;
  }
};

// Helper function to validate phone number
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone) ? 1 : 0;
};

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (userData) => {
  let filled = 0;
  let total = 3; // name, email, phone are required
  
  if (userData.name && userData.name.length > 0) filled++;
  if (userData.email && userData.email.length > 0) filled++;
  if (userData.phone && userData.phone.length > 0) filled++;
  
  if (userData.userType === 'individual_donor' || userData.userType === 'paid_donor') {
    total += 4; // age, weight, bloodGroup, hemoglobin
    if (userData.donorDetails?.age) filled++;
    if (userData.donorDetails?.weight) filled++;
    if (userData.donorDetails?.bloodGroup) filled++;
    if (userData.donorDetails?.hemoglobin) filled++;
  } else if (userData.userType === 'blood_bank') {
    total += 2; // registrationNumber, establishedYear
    if (userData.bloodBankDetails?.registrationNumber) filled++;
    if (userData.bloodBankDetails?.establishedYear) filled++;
  } else if (userData.userType === 'patient') {
    total += 2; // bloodGroup, urgencyLevel
    if (userData.patientDetails?.bloodGroup) filled++;
    if (userData.patientDetails?.urgencyLevel) filled++;
  }
  
  return total > 0 ? filled / total : 0;
};

// Enhanced fake user detection with ML
const detectFakeUser = async (userData) => {
  try {
    // Calculate features for ML model
    const features = {
      email_domain_score: calculateEmailDomainScore(userData.email),
      phone_valid: validatePhoneNumber(userData.phone),
      age: userData.donorDetails?.age || userData.patientDetails?.age || 25,
      name_length: userData.name?.length || 0,
      registration_hour: new Date().getHours(),
      profile_completeness: calculateProfileCompleteness(userData),
      location_accuracy: userData.location?.coordinates?.lat ? 0.8 : 0.5,
      social_links: userData.socialLinks ? 1 : 0,
      activity_frequency: 0.5 // Default for new user
    };
    
    // Call ML service for fake detection
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/detect-fake-user`, features, {
      timeout: 5000 // 5 second timeout
    });
    
    return {
      isFake: mlResponse.data.isFake,
      confidenceScore: mlResponse.data.confidenceScore,
      reason: mlResponse.data.reason,
      flags: mlResponse.data.flags
    };
  } catch (error) {
    console.error('ML Service error for fake detection:', error.message);
    
    // Fallback rule-based detection
    const flags = [];
    let isFake = false;
    
    // Rule-based checks
    if (userData.name?.length < 3) {
      flags.push("Name too short");
      isFake = true;
    }
    
    if (userData.email && calculateEmailDomainScore(userData.email) < 0.3) {
      flags.push("Suspicious email domain");
      isFake = true;
    }
    
    if (userData.phone && !validatePhoneNumber(userData.phone)) {
      flags.push("Invalid phone number");
      isFake = true;
    }
    
    const age = userData.donorDetails?.age || userData.patientDetails?.age;
    if (age && (age < 18 || age > 100)) {
      flags.push("Invalid age");
      isFake = true;
    }
    
    return {
      isFake,
      confidenceScore: isFake ? 70 : 80,
      reason: isFake ? "Suspicious patterns detected" : "User appears genuine",
      flags: flags.slice(0, 3)
    };
  }
};

// Registration validation rules
const registrationValidation = [
  body('name').notEmpty().withMessage('Name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('userType').isIn(['individual_donor', 'paid_donor', 'blood_bank', 'patient']).withMessage('Invalid user type')
];

// REGISTER route with fake user detection
router.post('/register', registrationValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, userType, location, donorDetails, bloodBankDetails, patientDetails } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Perform fake user detection
    const userDataForDetection = {
      name,
      email,
      phone,
      userType,
      donorDetails,
      patientDetails,
      location,
      socialLinks: req.body.socialLinks
    };
    
    const fakeDetection = await detectFakeUser(userDataForDetection);
    
    // If high confidence fake, reject registration
    if (fakeDetection.isFake && fakeDetection.confidenceScore > 80) {
      return res.status(403).json({
        message: 'Registration blocked: Suspicious activity detected',
        reason: fakeDetection.reason,
        flags: fakeDetection.flags
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with spam flag
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      userType,
      location: {
        ...location,
        coordinates: location?.coordinates || {},
        address: location?.address || '',
        city: location?.city || ''
      },
      donorDetails: userType.includes('donor') ? {
        ...donorDetails,
        isAvailable: donorDetails?.isAvailable !== undefined ? donorDetails.isAvailable : true,
        donationCount: donorDetails?.donationCount || 0
      } : undefined,
      bloodBankDetails: userType === 'blood_bank' ? {
        ...bloodBankDetails,
        // Initialize blood inventory with zeros
        bloodInventory: bloodBankDetails?.bloodInventory || {
          'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
          'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0
        }
      } : undefined,
      patientDetails: userType === 'patient' ? patientDetails : undefined,
      isVerified: !fakeDetection.isFake, // Auto-verify if not fake
      isSpam: fakeDetection.isFake, // Flag as spam if fake detected
      verificationFlags: fakeDetection.flags,
      verificationConfidence: fakeDetection.confidenceScore,
      registeredAt: new Date()
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType, isSpam: user.isSpam },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log the detection result
    console.log(`User registration: ${email} - Fake: ${fakeDetection.isFake} (${fakeDetection.confidenceScore}%)`);

    res.status(201).json({
      message: fakeDetection.isFake 
        ? 'Registration successful but flagged for review' 
        : 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        isSpam: user.isSpam
      },
      verification: {
        isFake: fakeDetection.isFake,
        confidence: fakeDetection.confidenceScore,
        flags: fakeDetection.flags
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN route
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is marked as spam (blocked)
    if (user.isSpam) {
      return res.status(403).json({ 
        message: 'Account blocked due to suspicious activity. Please contact support.',
        isSpam: true
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, userType: user.userType, isSpam: user.isSpam },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        isSpam: user.isSpam
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is marked as spam
    if (user.isSpam) {
      return res.status(403).json({ 
        message: 'Account blocked',
        isSpam: true
      });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// UPDATE location for live tracking
router.post('/update-location', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude required' });
    }
    
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      {
        $set: {
          'currentLocation': {
            lat: latitude,
            lng: longitude,
            timestamp: new Date()
          }
        }
      },
      { returnDocument: 'after' }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Location updated',
      location: user.currentLocation
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET location for tracking another user
router.get('/location/:userId', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const targetUserId = req.params.userId;
    
    const Request = mongoose.model('BloodRequest'); 
    const activeConnection = await Request.findOne({
      $or: [
        { patientId: decoded.userId, acceptedDonorId: targetUserId, status: 'fulfilled' },
        { patientId: targetUserId, acceptedDonorId: decoded.userId, status: 'fulfilled' }
      ]
    });
    
    if (!activeConnection) {
      return res.status(403).json({ message: 'No active tracking connection' });
    }
    
    const targetUser = await User.findById(targetUserId).select('name currentLocation');
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      userId: targetUserId,
      name: targetUser.name,
      location: targetUser.currentLocation || null
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =========================================================================
// NEW ADMIN ROUTE: SECURE HOSPITAL REGISTRATION (No Auth Token Required, Uses Secret Key)
// =========================================================================
router.post('/register-hospital', async (req, res) => {
  try {
    const { adminSecret, name, email, phone, location } = req.body;

    // Hardcoded Admin Key for academic project simplicity & security
    const MASTER_KEY = "IEEE_ADMIN_2026";

    if (adminSecret !== MASTER_KEY) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid Admin Secret Key.' });
    }

    if (!name || !email || !phone || !location.lat || !location.lng) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check if hospital email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Hospital email already exists in database.' });
    }

    // Default secure password for hospitals created by admin
    const hashedPassword = await bcrypt.hash("Hospital@Secure123", 10);

    const newHospital = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      userType: 'hospital', // Crucial for Organ Request matching!
      location: {
        address: location.address || '',
        city: location.city || '',
        coordinates: {
          lat: location.lat,
          lng: location.lng
        }
      },
      isVerified: true, // Admin created it, so it's auto-verified
      isSpam: false,
      registeredAt: new Date()
    });

    await newHospital.save();

    res.status(201).json({
      success: true,
      message: `Hospital '${name}' has been successfully added to the Transplant Network Database!`,
      hospitalId: newHospital._id
    });

  } catch (error) {
    console.error('Admin Hospital Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error while registering hospital.' });
  }
});

export default router;