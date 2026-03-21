import express from 'express';
import axios from 'axios'; // IMPORTED AXIOS FOR ML
import { User } from '../models/User.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { authenticate } from '../middleware/auth.js';
// IMPORTED THE 3 WHATSAPP FUNCTIONS
import { sendWhatsAppAlert, sendPatientSuccessWhatsApp, sendRequestClosedWhatsApp } from '../services/whatsappService.js';

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

// ============================================
// ENDPOINT: Create Emergency Request & Alert Donors
// ============================================
router.post('/emergency', authenticate, async (req, res) => {
  try {
    const { bloodGroup } = req.body;
    const patient = await User.findById(req.userId);

    if (patient.userType !== 'patient') {
      return res.status(403).json({ message: 'Only patients can create emergency requests' });
    }

    const patientLat = patient.location?.coordinates?.lat || 0;
    const patientLng = patient.location?.coordinates?.lng || 0;

    const newRequest = new BloodRequest({
      patientId: patient._id,
      bloodGroup: bloodGroup || patient.patientDetails?.bloodGroup,
      urgency: 'emergency',
      status: 'pending'
    });

    const donors = await User.find({
      userType: { $in: ['individual_donor', 'paid_donor', 'blood_bank'] },
      $or: [
        { 'donorDetails.bloodGroup': newRequest.bloodGroup },
        { 'bloodBankDetails.registrationNumber': { $exists: true } }
      ],
      'donorDetails.isAvailable': true
    });

    let sortedDonors = [];

    // -----------------------------------------------------------------
    // ML INTEGRATION: Smart Donor Ranking & Prediction (IEEE standard)
    // -----------------------------------------------------------------
    try {
      console.log('🤖 Asking ML Model for Smart Donor Ranking...');
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/find-best-donors`, {
        bloodGroup: newRequest.bloodGroup,
        latitude: patientLat,
        longitude: patientLng,
        urgency: 'emergency'
      });

      if (mlResponse.data && mlResponse.data.donors && mlResponse.data.donors.length > 0) {
        console.log('✅ ML Model successfully ranked donors!');
        // Rebuild the sorted list strictly based on the ML Model's optimal predictions
        const mlDonorIds = mlResponse.data.donors.map(d => (d.donorId || d.id).toString());
        mlDonorIds.forEach(id => {
          const found = donors.find(d => d._id.toString() === id);
          if (found) sortedDonors.push(found);
        });
      } else {
        throw new Error('ML returned empty ranking');
      }
    } catch (mlError) {
      console.log('⚠️ ML Model unavailable, falling back to pure Haversine Distance Calculation...');
      
      // Fallback: Pure Haversine distance sorting if python server is off
      sortedDonors = donors.map(donor => {
        const donorLat = donor.location?.coordinates?.lat || 0;
        const donorLng = donor.location?.coordinates?.lng || 0;
        const distance = haversineDistance(patientLat, patientLng, donorLat, donorLng);
        return { ...donor.toObject(), distance };
      }).sort((a, b) => a.distance - b.distance);
    }

    const topDonors = sortedDonors.slice(0, 5);
    newRequest.notifiedDonors = topDonors.map(d => d._id);
    await newRequest.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    topDonors.forEach(async (donor) => {
      const actionLink = `${frontendUrl}/accept-request/${newRequest._id}/${donor._id}`;
      // Send WHATSAPP Alert directly
      await sendWhatsAppAlert(donor.phone, newRequest.bloodGroup, actionLink); 
    });

    res.json({
      success: true,
      message: `Emergency request created. WhatsApp alerts sent to ${topDonors.length} nearby donors.`,
      notifiedCount: topDonors.length,
      requestId: newRequest._id
    });

  } catch (error) {
    console.error('Emergency request error:', error);
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

    if (bloodRequest.status === 'fulfilled') {
      return res.json({ 
        success: false, 
        alreadyFulfilled: true,
        message: 'This request has already been satisfied by another donor. Thank you for your willingness to help!' 
      });
    }

    bloodRequest.status = 'fulfilled';
    bloodRequest.acceptedBy = donorId;
    await bloodRequest.save();

    // 1. Notify Patient via WHATSAPP that donor was found!
    if (bloodRequest.patientId && bloodRequest.patientId.phone) {
      await sendPatientSuccessWhatsApp(bloodRequest.patientId.phone, donor.name, donor.phone);
    }

    // -----------------------------------------------------------------
    // 2. NEW: NOTIFY ALL OTHER ALERTED DONORS THAT REQUEST IS CLOSED
    // -----------------------------------------------------------------
    if (bloodRequest.notifiedDonors && bloodRequest.notifiedDonors.length > 0) {
      // Find all alerted donors EXCEPT the one who just accepted
      const otherDonors = await User.find({
        _id: { $in: bloodRequest.notifiedDonors, $ne: donorId }
      });

      // Send the "Stand-down" message to them
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
      patientPhone: bloodRequest.patientId.phone
    });

  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;