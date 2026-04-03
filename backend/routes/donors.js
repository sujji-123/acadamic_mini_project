// routes/donors.js
import express from 'express';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// ML Service URL (FastAPI)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Haversine formula for distance calculation
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate donor eligibility score (based on IEEE paper)
const calculateEligibilityScore = (donor) => {
  let score = 0;
  const details = donor.donorDetails || {};
  
  if (details.age >= 18 && details.age <= 60) {
    if (details.age >= 25 && details.age <= 45) {
      score += 25; 
    } else {
      score += 20; 
    }
  } else {
    return 0; 
  }
  
  if (details.weight >= 50) {
    if (details.weight >= 70) {
      score += 20; 
    } else {
      score += 15; 
    }
  } else {
    return 0; 
  }
  
  if (details.hemoglobin >= 12.5) {
    if (details.hemoglobin >= 14) {
      score += 25; 
    } else {
      score += 20; 
    }
  } else {
    return 0; 
  }
  
  if (details.lastDonationDate) {
    const daysSince = Math.floor((new Date() - new Date(details.lastDonationDate)) / (1000 * 60 * 60 * 24));
    if (daysSince >= 90) {
      if (daysSince >= 180) {
        score += 30; 
      } else {
        score += 20; 
      }
    } else {
      return 0; 
    }
  } else {
    score += 30; 
  }
  
  return Math.min(100, score); 
};

// Call ML service for donor ranking
const callMLRankingService = async (bloodGroup, latitude, longitude) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/find-best-donors`, {
      bloodGroup,
      latitude,
      longitude,
      urgency: 'normal'
    });
    return response.data;
  } catch (error) {
    console.error('ML Service error:', error.message);
    return null; 
  }
};

// ============================================
// ENDPOINT 1: Find Nearby Donors (Local Calculation)
// ============================================

router.post('/find-nearby', authenticate, async (req, res) => {
  try {
    const { bloodGroup, latitude, longitude, radius = 50 } = req.body;

    if (!bloodGroup || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Blood group, latitude and longitude are required' 
      });
    }

    const donors = await User.find({
      userType: { $in: ['individual_donor', 'paid_donor', 'blood_bank'] },
      $or: [
        { 'donorDetails.bloodGroup': bloodGroup },
        { 'bloodBankDetails.registrationNumber': { $exists: true } }
      ],
      'donorDetails.isAvailable': true
    });

    if (!donors.length) {
      return res.json({ 
        message: 'No donors found', 
        donors: [] 
      });
    }

    const donorsWithDistance = await Promise.all(
      donors.map(async (donor) => {
        const donorLat = donor.location?.coordinates?.lat;
        const donorLng = donor.location?.coordinates?.lng;
        
        let distance = Infinity;
        if (donorLat && donorLng) {
          distance = haversineDistance(latitude, longitude, donorLat, donorLng);
        }

        const eligibilityScore = donor.userType === 'blood_bank' ? 100 : calculateEligibilityScore(donor);

        return {
          id: donor._id,
          name: donor.name,
          bloodGroup: donor.donorDetails?.bloodGroup || bloodGroup,
          phone: donor.phone,
          distance: Math.round(distance * 100) / 100,
          eligibilityScore,
          age: donor.donorDetails?.age,
          weight: donor.donorDetails?.weight,
          hemoglobin: donor.donorDetails?.hemoglobin,
          lastDonation: donor.donorDetails?.lastDonationDate,
          donationCount: donor.donorDetails?.donationCount || 0,
          userType: donor.userType,
          expectedAmount: donor.donorDetails?.expectedAmount,
          location: donor.location,
          isEligible: eligibilityScore > 60 || donor.userType === 'blood_bank'
        };
      })
    );

    const filteredDonors = donorsWithDistance.filter(
      d => d.distance <= radius && d.isEligible
    );

    filteredDonors.sort((a, b) => {
      if (a.distance === b.distance) {
        return b.eligibilityScore - a.eligibilityScore;
      }
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      count: filteredDonors.length,
      donors: filteredDonors.slice(0, 20) 
    });

  } catch (error) {
    console.error('Find nearby donors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// ENDPOINT 2: Find Best Donors using ML (Smart Ranking)
// ============================================

router.post('/find-best-ml', authenticate, async (req, res) => {
  try {
    const { bloodGroup, latitude, longitude } = req.body;

    if (!bloodGroup || !latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Blood group, latitude and longitude are required' 
      });
    }

    const mlResult = await callMLRankingService(bloodGroup, latitude, longitude);

    if (mlResult && mlResult.success) {
      return res.json({
        success: true,
        method: 'ml',
        donors: mlResult.donors,
        message: 'Donors ranked using ML model'
      });
    }

    console.log('ML service unavailable, using local calculation');
    
    const donors = await User.find({
      userType: { $in: ['individual_donor', 'paid_donor'] },
      'donorDetails.bloodGroup': bloodGroup,
      'donorDetails.isAvailable': true
    });

    if (!donors.length) {
      return res.json({ 
        success: true,
        method: 'local',
        donors: [],
        message: 'No donors found' 
      });
    }

    const rankedDonors = await Promise.all(
      donors.map(async (donor) => {
        const donorLat = donor.location?.coordinates?.lat;
        const donorLng = donor.location?.coordinates?.lng;
        
        let distance = Infinity;
        if (donorLat && donorLng) {
          distance = haversineDistance(latitude, longitude, donorLat, donorLng);
        }

        const eligibilityScore = calculateEligibilityScore(donor);

        const distanceScore = distance === Infinity ? 0 : Math.max(0, 100 - (distance * 5));
        const finalScore = (eligibilityScore * 0.6) + (distanceScore * 0.4);

        return {
          donorId: donor._id,
          name: donor.name,
          bloodGroup: donor.donorDetails?.bloodGroup,
          distance: Math.round(distance * 100) / 100,
          eligibilityScore,
          finalScore: Math.round(finalScore),
          phone: donor.phone,
          age: donor.donorDetails?.age,
          weight: donor.donorDetails?.weight,
          lastDonation: donor.donorDetails?.lastDonationDate,
          donationCount: donor.donorDetails?.donationCount || 0,
          userType: donor.userType,
          expectedAmount: donor.donorDetails?.expectedAmount
        };
      })
    );

    const eligibleDonors = rankedDonors.filter(d => d.eligibilityScore > 60);
    
    eligibleDonors.sort((a, b) => b.finalScore - a.finalScore);

    res.json({
      success: true,
      method: 'local',
      count: eligibleDonors.length,
      donors: eligibleDonors.slice(0, 20),
      message: 'Donors ranked using local calculation'
    });

  } catch (error) {
    console.error('Find best donors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// ENDPOINT 3: Get Donor Details by ID
// ============================================

router.get('/:donorId', authenticate, async (req, res) => {
  try {
    const donor = await User.findById(req.params.donorId)
      .select('-password'); 

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    if (!['individual_donor', 'paid_donor', 'blood_bank'].includes(donor.userType)) {
      return res.status(400).json({ message: 'User is not a donor' });
    }

    const eligibilityScore = donor.userType === 'blood_bank' ? 100 : calculateEligibilityScore(donor);

    res.json({
      success: true,
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodGroup: donor.donorDetails?.bloodGroup,
        age: donor.donorDetails?.age,
        weight: donor.donorDetails?.weight,
        hemoglobin: donor.donorDetails?.hemoglobin,
        lastDonation: donor.donorDetails?.lastDonationDate,
        donationCount: donor.donorDetails?.donationCount || 0,
        isAvailable: donor.donorDetails?.isAvailable,
        userType: donor.userType,
        expectedAmount: donor.donorDetails?.expectedAmount,
        location: donor.location,
        eligibilityScore,
        isEligible: eligibilityScore > 60 || donor.userType === 'blood_bank',
        verified: donor.isVerified
      }
    });

  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT 4: Update Donor Availability
// ============================================

router.put('/availability', authenticate, async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const user = await User.findById(req.userId);
    
    if (!['individual_donor', 'paid_donor', 'blood_bank'].includes(user.userType)) {
      return res.status(400).json({ message: 'User is not a donor' });
    }

    if (!user.donorDetails) {
        user.donorDetails = {};
    }

    user.donorDetails.isAvailable = isAvailable;
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      isAvailable,
      user
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT 5: Update Donation History (After Donation)
// ============================================

router.post('/donation-completed', authenticate, async (req, res) => {
  try {
    const { recipientId, units, type = 'voluntary', amount = 0 } = req.body;

    const donor = await User.findById(req.userId);
    
    if (!['individual_donor', 'paid_donor'].includes(donor.userType)) {
      return res.status(400).json({ message: 'User is not a donor' });
    }

    donor.donorDetails.lastDonationDate = new Date();
    donor.donorDetails.donationCount = (donor.donorDetails.donationCount || 0) + 1;
    donor.donorDetails.isAvailable = false; 
    
    const nextEligibleDate = new Date();
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);
    donor.donorDetails.nextEligibleDate = nextEligibleDate;

    await donor.save();

    res.json({
      success: true,
      message: 'Donation recorded successfully',
      nextEligibleDate,
      totalDonations: donor.donorDetails.donationCount
    });

  } catch (error) {
    console.error('Donation completion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT 6: Get Donors by Blood Group (Simple Search)
// ============================================

router.get('/blood-group/:bloodGroup', authenticate, async (req, res) => {
  try {
    const { bloodGroup } = req.params;
    const { limit = 20, available = true } = req.query;

    const query = {
      userType: { $in: ['individual_donor', 'paid_donor', 'blood_bank'] },
      $or: [
        { 'donorDetails.bloodGroup': bloodGroup },
        { 'bloodBankDetails.registrationNumber': { $exists: true } }
      ]
    };

    if (available === 'true') {
      query['donorDetails.isAvailable'] = true;
    }

    const donors = await User.find(query)
      .select('name phone location donorDetails bloodBankDetails userType')
      .limit(parseInt(limit));

    const donorsWithScore = donors.map(donor => ({
      id: donor._id,
      name: donor.name,
      phone: donor.phone,
      bloodGroup: donor.donorDetails?.bloodGroup || bloodGroup,
      location: donor.location,
      age: donor.donorDetails?.age,
      weight: donor.donorDetails?.weight,
      isAvailable: donor.donorDetails?.isAvailable,
      userType: donor.userType,
      eligibilityScore: donor.userType === 'blood_bank' ? 100 : calculateEligibilityScore(donor),
      donationCount: donor.donorDetails?.donationCount || 0
    }));

    res.json({
      success: true,
      count: donorsWithScore.length,
      donors: donorsWithScore
    });

  } catch (error) {
    console.error('Get by blood group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// ENDPOINT 7: ML-Based Fake User Detection
// ============================================

router.post('/verify-user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const features = {
      email_domain_score: user.email.includes('gmail') || user.email.includes('yahoo') ? 0.9 : 0.5,
      phone_valid: user.phone ? 1 : 0,
      age: user.donorDetails?.age || 0,
      name_length: user.name.length,
      registration_hour: new Date(user.createdAt).getHours(),
      profile_completeness: calculateProfileCompleteness(user),
      location_accuracy: user.location?.coordinates ? 0.8 : 0.2,
      social_links: 0, 
      activity_frequency: user.lastActive ? 0.7 : 0.3
    };

    try {
      const mlResponse = await axios.post(`${ML_SERVICE_URL}/detect-fake-user`, features);
      
      if (mlResponse.data) {
        return res.json({
          success: true,
          verification: mlResponse.data
        });
      }
    } catch (mlError) {
      console.error('ML service error:', mlError.message);
    }

    const isFake = (
      features.name_length < 3 ||
      features.age < 15 ||
      features.age > 100 ||
      features.phone_valid === 0 ||
      features.profile_completeness < 0.3
    );

    res.json({
      success: true,
      verification: {
        isFake,
        confidenceScore: isFake ? 70 : 85,
        reason: isFake ? 'Suspicious profile patterns detected' : 'User appears genuine',
        flags: []
      }
    });

  } catch (error) {
    console.error('User verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const calculateProfileCompleteness = (user) => {
  let total = 0;
  let filled = 0;

  if (user.name) filled++;
  total++;
  
  if (user.email) filled++;
  total++;
  
  if (user.phone) filled++;
  total++;
  
  if (user.donorDetails) {
    if (user.donorDetails.age) filled++;
    total++;
    
    if (user.donorDetails.bloodGroup) filled++;
    total++;
    
    if (user.donorDetails.weight) filled++;
    total++;
    
    if (user.donorDetails.hemoglobin) filled++;
    total++;
  }
  
  if (user.location?.coordinates) filled++;
  total++;

  return total > 0 ? filled / total : 0;
};

// ============================================
// ENDPOINT 8: Get Blood Demand Forecast
// ============================================

router.get('/forecast/demand', authenticate, async (req, res) => {
  try {
    try {
      const mlResponse = await axios.get(`${ML_SERVICE_URL}/forecast-demand?days=30`);
      
      if (mlResponse.data) {
        return res.json({
          success: true,
          method: 'ml',
          forecast: mlResponse.data.forecast
        });
      }
    } catch (mlError) {
      console.error('ML forecast error:', mlError.message);
    }

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const forecast = [];

    for (const bg of bloodGroups) {
      const donorCount = await User.countDocuments({
        userType: { $in: ['individual_donor', 'paid_donor'] },
        'donorDetails.bloodGroup': bg,
        'donorDetails.isAvailable': true
      });

      const demandScore = Math.max(1, 50 - donorCount); 

      forecast.push({
        bloodGroup: bg,
        availableDonors: donorCount,
        demandLevel: demandScore > 30 ? 'high' : demandScore > 15 ? 'medium' : 'low',
        suggestedAction: donorCount < 10 ? 'URGENT: Need more donors' : 'Adequate supply'
      });
    }

    res.json({
      success: true,
      method: 'simple',
      forecast
    });

  } catch (error) {
    console.error('Demand forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==============================================================
// NEW ENDPOINT 9: Update Blood Bank Inventory
// ==============================================================
router.put('/inventory', authenticate, async (req, res) => {
    try {
      const { bloodGroup, units } = req.body;
  
      const user = await User.findById(req.userId);
      
      if (user.userType !== 'blood_bank') {
        return res.status(403).json({ message: 'Only Blood Banks can update inventory' });
      }
      
      // Since we don't have a complex inventory schema yet, we'll store it as a generic string or status
      // In a real app, you'd have a map of { 'A+': 50, 'O-': 10 }
      
      if (!user.donorDetails) user.donorDetails = {};
      
      // If units > 0, they are available. If 0, they are unavailable for that type
      user.donorDetails.isAvailable = units > 0;
      user.donorDetails.bloodGroup = bloodGroup; // Assuming they are updating the primary group they have
  
      await user.save();
  
      res.json({
        success: true,
        message: `Inventory updated for ${bloodGroup}`,
        isAvailable: user.donorDetails.isAvailable
      });
  
    } catch (error) {
      console.error('Update inventory error:', error);
      res.status(500).json({ message: 'Server error updating inventory' });
    }
});

export default router;