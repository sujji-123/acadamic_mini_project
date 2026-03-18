import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { Verification } from '../models/Verification.js';
import { sendOTP, generateOTP } from '../services/otpService.js';
import { authenticate } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Request OTP for mobile/email
router.post('/request-otp', [
  body('userId').notEmpty(),
  body('type').isIn(['mobile', 'email'])
], async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let verification = await Verification.findOne({ userId });
    if (!verification) {
      verification = new Verification({ userId });
    }

    const { otp, expiresAt } = await sendOTP(
      type === 'mobile' ? user.phone : null,
      type === 'email' ? user.email : null
    );

    if (type === 'mobile') {
      verification.mobileOTP = {
        code: await bcrypt.hash(otp, 10),
        expiresAt,
        verified: false
      };
    } else {
      verification.emailOTP = {
        code: await bcrypt.hash(otp, 10),
        expiresAt,
        verified: false
      };
    }

    await verification.save();
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('userId').notEmpty(),
  body('type').isIn(['mobile', 'email']),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const { userId, type, otp } = req.body;
    
    const verification = await Verification.findOne({ userId });
    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    const otpData = type === 'mobile' ? verification.mobileOTP : verification.emailOTP;
    
    if (!otpData || !otpData.code) {
      return res.status(400).json({ message: 'OTP not requested' });
    }

    if (new Date() > otpData.expiresAt) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const isValid = await bcrypt.compare(otp, otpData.code);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (type === 'mobile') {
      verification.mobileOTP.verified = true;
    } else {
      verification.emailOTP.verified = true;
    }

    // Update overall status
    if (verification.mobileOTP.verified && verification.emailOTP.verified) {
      verification.verificationStatus = 'partial';
    }

    await verification.save();
    
    // Update user verification status
    await User.findByIdAndUpdate(userId, { 
      isVerified: verification.verificationStatus === 'verified'
    });

    res.json({ 
      message: 'OTP verified successfully',
      status: verification.verificationStatus
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Hospital verification for patients
router.post('/verify-hospital', authenticate, [
  body('hospitalName').notEmpty(),
  body('hospitalRegNo').notEmpty(),
  body('doctorName').notEmpty(),
  body('doctorLicense').notEmpty()
], async (req, res) => {
  try {
    const { hospitalName, hospitalRegNo, doctorName, doctorLicense } = req.body;
    
    let verification = await Verification.findOne({ userId: req.userId });
    if (!verification) {
      verification = new Verification({ userId: req.userId });
    }

    verification.hospitalVerification = {
      hospitalName,
      hospitalRegNo,
      doctorName,
      doctorLicense,
      verified: false, // Admin will verify
      documents: []
    };

    await verification.save();
    
    res.json({ 
      message: 'Hospital details submitted for verification',
      status: 'pending'
    });
  } catch (error) {
    console.error('Hospital verification error:', error);
    res.status(500).json({ message: 'Submission failed' });
  }
});

// Get verification status
router.get('/status/:userId', authenticate, async (req, res) => {
  try {
    const verification = await Verification.findOne({ userId: req.params.userId });
    if (!verification) {
      return res.json({ status: 'not_started' });
    }

    res.json({
      mobileVerified: verification.mobileOTP?.verified || false,
      emailVerified: verification.emailOTP?.verified || false,
      hospitalVerified: verification.hospitalVerification?.verified || false,
      mlScore: verification.mlVerificationScore,
      overallStatus: verification.verificationStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status' });
  }
});

export default router;