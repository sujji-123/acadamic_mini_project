import express from 'express';
import axios from 'axios';
import { User } from '../models/User.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { authenticate } from '../middleware/auth.js';
import { sendWhatsAppAlert, sendPatientSuccessWhatsApp, sendRequestClosedWhatsApp, whatsappClient } from '../services/whatsappService.js';

const router = express.Router();

// Your Python ML server URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Haversine formula for distance calculation
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

// Helper function to verify user before emergency request
const verifyUserForEmergency = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { verified: false, reason: 'User not found' };
    
    // Check if user is marked as spam
    if (user.isSpam) {
      return { verified: false, reason: 'Account flagged as suspicious' };
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return { verified: false, reason: 'Account not verified' };
    }
    
    // Check if user has completed profile sufficiently
    const hasBloodGroup = user.patientDetails?.bloodGroup;
    if (!hasBloodGroup) {
      return { verified: false, reason: 'Blood group not specified in profile' };
    }
    
    // Check for suspicious activity (too many requests in short time)
    const recentRequests = await BloodRequest.countDocuments({
      patientId: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    
    if (recentRequests >= 3) {
      return { verified: false, reason: 'Too many requests in 24 hours' };
    }
    
    return { verified: true, user };
  } catch (error) {
    console.error('User verification error:', error);
    return { verified: false, reason: 'Verification failed' };
  }
};

// ============================================
// ENDPOINT: Create Emergency Request & Alert Donors (with Verification)
// ============================================
router.post('/emergency', authenticate, async (req, res) => {
  try {
    const { bloodGroup, latitude, longitude } = req.body;
    
    // STEP 1: Verify user before processing emergency request
    const verification = await verifyUserForEmergency(req.userId);
    if (!verification.verified) {
      return res.status(403).json({ 
        success: false, 
        message: `Cannot process emergency request: ${verification.reason}`,
        requiresVerification: verification.reason.includes('verified')
      });
    }
    
    const patient = verification.user;
    
    // Get patient location (use provided or from profile)
    const patientLat = latitude || patient.location?.coordinates?.lat || 0;
    const patientLng = longitude || patient.location?.coordinates?.lng || 0;
    const finalBloodGroup = bloodGroup || patient.patientDetails?.bloodGroup;
    
    if (!finalBloodGroup) {
      return res.status(400).json({ 
        success: false, 
        message: 'Blood group is required for emergency request' 
      });
    }

    // STEP 2: Create the request
    const newRequest = new BloodRequest({
      patientId: patient._id,
      bloodGroup: finalBloodGroup,
      urgency: 'emergency',
      status: 'pending',
      location: {
        lat: patientLat,
        lng: patientLng,
        address: patient.location?.address || ''
      }
    });

    // STEP 3: Find eligible donors (exclude spam users)
    const donors = await User.find({
      userType: { $in: ['individual_donor', 'paid_donor', 'blood_bank'] },
      $or: [
        { 'donorDetails.bloodGroup': finalBloodGroup },
        { 'bloodBankDetails.registrationNumber': { $exists: true } }
      ],
      'donorDetails.isAvailable': true,
      isSpam: { $ne: true }, // Exclude spam users
      isVerified: true // Only verified donors
    });

    if (donors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No eligible donors found in your area. Please try again later.'
      });
    }

    let sortedDonors = [];

    // STEP 4: ML Integration for Smart Donor Ranking
    try {
      console.log('🤖 Asking ML Model for Smart Donor Ranking...');
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/find-best-donors`, {
        bloodGroup: finalBloodGroup,
        latitude: patientLat,
        longitude: patientLng,
        urgency: 'emergency'
      }, { timeout: 8000 });

      if (mlResponse.data && mlResponse.data.donors && mlResponse.data.donors.length > 0) {
        console.log('✅ ML Model successfully ranked donors!');
        const mlDonorIds = mlResponse.data.donors.map(d => (d.donorId || d.id).toString());
        mlDonorIds.forEach(id => {
          const found = donors.find(d => d._id.toString() === id);
          if (found) sortedDonors.push(found);
        });
        // Add remaining donors that weren't in ML ranking
        donors.forEach(donor => {
          if (!sortedDonors.find(d => d._id.toString() === donor._id.toString())) {
            sortedDonors.push(donor);
          }
        });
      } else {
        throw new Error('ML returned empty ranking');
      }
    } catch (mlError) {
      console.log('⚠️ ML Model unavailable, falling back to pure Haversine Distance Calculation...');
      
      // Fallback: Pure Haversine distance sorting
      sortedDonors = donors.map(donor => {
        const donorLat = donor.location?.coordinates?.lat || 0;
        const donorLng = donor.location?.coordinates?.lng || 0;
        const distance = haversineDistance(patientLat, patientLng, donorLat, donorLng);
        return { ...donor.toObject(), distance };
      }).sort((a, b) => a.distance - b.distance);
    }

    // STEP 5: Select top 10 donors to notify
    const topDonors = sortedDonors.slice(0, 10);
    newRequest.notifiedDonors = topDonors.map(d => d._id);
    await newRequest.save();

    // STEP 6: Send WhatsApp alerts
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let notifiedCount = 0;
    
    for (const donor of topDonors) {
      const actionLink = `${frontendUrl}/accept-request/${newRequest._id}/${donor._id}`;
      const sent = await sendWhatsAppAlert(donor.phone, newRequest.bloodGroup, actionLink);
      if (sent) notifiedCount++;
    }

    // STEP 7: Log the request for analytics
    console.log(`Emergency request created by ${patient.email} - Blood Group: ${finalBloodGroup} - Notified: ${notifiedCount} donors`);

    res.json({
      success: true,
      message: `Emergency request created. ${notifiedCount} donors notified via WhatsApp.`,
      notifiedCount: notifiedCount,
      requestId: newRequest._id,
      request: {
        bloodGroup: finalBloodGroup,
        urgency: 'emergency',
        createdAt: newRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Emergency request error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// ============================================
// ENDPOINT: Create Regular Request (with verification)
// ============================================
router.post('/create', authenticate, async (req, res) => {
  try {
    const { bloodGroup, latitude, longitude, urgency = 'normal' } = req.body;
    
    // Verify user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.userType !== 'patient') {
      return res.status(403).json({ message: 'Only patients can create requests' });
    }
    
    if (user.isSpam) {
      return res.status(403).json({ message: 'Account flagged. Cannot create requests.' });
    }
    
    const finalBloodGroup = bloodGroup || user.patientDetails?.bloodGroup;
    if (!finalBloodGroup) {
      return res.status(400).json({ message: 'Blood group is required' });
    }
    
    const patientLat = latitude || user.location?.coordinates?.lat || 0;
    const patientLng = longitude || user.location?.coordinates?.lng || 0;
    
    const newRequest = new BloodRequest({
      patientId: user._id,
      bloodGroup: finalBloodGroup,
      urgency: urgency,
      status: 'pending',
      location: {
        lat: patientLat,
        lng: patientLng,
        address: user.location?.address || ''
      }
    });
    
    await newRequest.save();
    
    res.json({
      success: true,
      message: 'Request created successfully',
      requestId: newRequest._id,
      request: newRequest
    });
    
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT: Donor clicks link to Accept Request
// ============================================
router.post('/accept/:requestId/:donorId', async (req, res) => {
  try {
    const { requestId, donorId } = req.params;

    const bloodRequest = await BloodRequest.findById(requestId).populate('patientId');
    const donor = await User.findById(donorId);

    if (!bloodRequest) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found.' });
    }
    
    // Check if donor is spam
    if (donor.isSpam) {
      return res.status(403).json({ success: false, message: 'Your account has been flagged. Cannot accept requests.' });
    }

    if (bloodRequest.status === 'fulfilled') {
      return res.json({ 
        success: false, 
        alreadyFulfilled: true,
        message: 'This request has already been satisfied by another donor. Thank you for your willingness to help!' 
      });
    }
    
    if (bloodRequest.status === 'cancelled') {
      return res.json({ 
        success: false, 
        message: 'This request has been cancelled by the patient.' 
      });
    }

    bloodRequest.status = 'fulfilled';
    bloodRequest.acceptedBy = donorId;
    bloodRequest.acceptedDonorId = donorId;
    bloodRequest.acceptedAt = new Date();
    await bloodRequest.save();

    // Update donor's donation count
    if (donor.donorDetails) {
      donor.donorDetails.donationCount = (donor.donorDetails.donationCount || 0) + 1;
      donor.donorDetails.lastDonationDate = new Date();
      await donor.save();
    }

    // 1. Notify Patient via WhatsApp that donor was found!
    if (bloodRequest.patientId && bloodRequest.patientId.phone) {
      await sendPatientSuccessWhatsApp(bloodRequest.patientId.phone, donor.name, donor.phone);
    }

    // 2. NOTIFY ALL OTHER ALERTED DONORS THAT REQUEST IS CLOSED
    if (bloodRequest.notifiedDonors && bloodRequest.notifiedDonors.length > 0) {
      const otherDonors = await User.find({
        _id: { $in: bloodRequest.notifiedDonors, $ne: donorId }
      });

      otherDonors.forEach(async (otherDonor) => {
        if (otherDonor.phone) {
          await sendRequestClosedWhatsApp(otherDonor.phone);
        }
      });
    }

    res.json({
      success: true,
      message: 'You have successfully accepted the request! The patient has been notified with your contact details.',
      patientName: bloodRequest.patientId.name,
      patientPhone: bloodRequest.patientId.phone,
      requestId: bloodRequest._id
    });

  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT: Get user's requests
// ============================================
router.get('/my-requests', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    let requests;
    if (user.userType === 'patient') {
      requests = await BloodRequest.find({ patientId: req.userId })
        .sort({ createdAt: -1 })
        .populate('acceptedDonorId', 'name phone');
    } else if (user.userType.includes('donor')) {
      requests = await BloodRequest.find({ 
        notifiedDonors: req.userId,
        status: { $ne: 'cancelled' }
      }).sort({ createdAt: -1 }).populate('patientId', 'name phone location');
    } else {
      requests = await BloodRequest.find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('patientId', 'name phone')
        .populate('acceptedDonorId', 'name');
    }
    
    res.json({
      success: true,
      requests: requests
    });
    
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT: Cancel request
// ============================================
router.put('/cancel/:requestId', authenticate, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    if (request.patientId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }
    
    if (request.status === 'fulfilled') {
      return res.status(400).json({ message: 'Cannot cancel fulfilled request' });
    }
    
    request.status = 'cancelled';
    await request.save();
    
    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT: Get request details
// ============================================
router.get('/:requestId', async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.requestId)
      .populate('patientId', 'name phone location')
      .populate('acceptedDonorId', 'name phone location');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json({
      success: true,
      request: request
    });
    
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================================================
// NEW REAL ENDPOINT: Broadcast Emergency Organ Request to Database Hospitals
// ==============================================================
router.post('/organ-emergency', authenticate, async (req, res) => {
  try {
    const { organType, latitude, longitude } = req.body;
    
    // 1. Identify the patient making the request
    const patient = await User.findById(req.userId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const patientLat = latitude || patient.location?.coordinates?.lat || 0;
    const patientLng = longitude || patient.location?.coordinates?.lng || 0;
    
    // 2. SEARCH THE DATABASE for users registered as 'hospital'
    const hospitals = await User.find({ userType: 'hospital' });

    if (hospitals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registered Transplant Centers found in the database. Please register a hospital first.'
      });
    }

    // 3. Rank hospitals by distance using Haversine
    const nearbyHospitals = hospitals.map(hospital => {
      const hospLat = hospital.location?.coordinates?.lat || 0;
      const hospLng = hospital.location?.coordinates?.lng || 0;
      const distance = haversineDistance(patientLat, patientLng, hospLat, hospLng);
      return { ...hospital.toObject(), distance };
    }).sort((a, b) => a.distance - b.distance);

    let notifiedCount = 0;

    // 4. Send REAL WhatsApp alerts to the matched hospitals
    for (const hospital of nearbyHospitals) {
      const cleanPhone = hospital.phone.replace(/\D/g, '').slice(-10);
      const chatId = `91${cleanPhone}@c.us`;
      
      const message = `🚨 *URGENT SOTTO ORGAN REQUEST* 🚨\n\nAuthorized Medical Alert: A patient requires a *${organType}* transplant.\n\nPatient Distance: ${hospital.distance.toFixed(2)} km\nInitiating Hospital ID: ${patient._id}\n\nPlease check the National Registry portal immediately to review medical reports and respond.\n\n_State Organ and Tissue Transplant Organization (SOTTO)_`;

      try {
        await whatsappClient.sendMessage(chatId, message);
        console.log(`🏥 WhatsApp Alert sent to Hospital: ${hospital.name} (+91-${cleanPhone})`);
        notifiedCount++;
      } catch (error) {
        console.error(`❌ Failed to send WhatsApp to hospital ${hospital.name}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Emergency broadcast successful! ${notifiedCount} Authorized Transplant Centers have been alerted via WhatsApp.`,
      notifiedHospitals: nearbyHospitals.map(h => ({ name: h.name, distance: h.distance }))
    });
    
  } catch (error) {
    console.error('Organ request error:', error);
    res.status(500).json({ success: false, message: 'Server error processing organ request' });
  }
});

export default router;