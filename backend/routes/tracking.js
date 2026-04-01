import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { BloodRequest } from '../models/BloodRequest.js';

const router = express.Router();

// Get active tracking connections for a user
router.get('/active/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is requesting their own tracking or is authorized
    if (req.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // Find accepted requests where user is either patient or donor
    const acceptedRequests = await BloodRequest.find({
      $or: [
        { patientId: userId, status: 'accepted' },
        { acceptedDonorId: userId, status: 'accepted' }
      ]
    });
    
    const trackings = [];
    
    for (const req of acceptedRequests) {
      if (req.patientId.toString() === userId) {
        // User is patient, track donor
        const donor = await User.findById(req.acceptedDonorId).select('name currentLocation');
        if (donor) {
          trackings.push({
            type: 'donor',
            userId: donor._id,
            name: donor.name,
            location: donor.currentLocation || null,
            requestId: req._id
          });
        }
      } else {
        // User is donor, track patient
        const patient = await User.findById(req.patientId).select('name currentLocation');
        if (patient) {
          trackings.push({
            type: 'patient',
            userId: patient._id,
            name: patient.name,
            location: patient.currentLocation || null,
            requestId: req._id
          });
        }
      }
    }
    
    res.json({
      success: true,
      trackings
    });
    
  } catch (error) {
    console.error('Get active trackings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get location of a tracked user
router.get('/location/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;
    
    // Check if there's an active connection between users
    const activeConnection = await BloodRequest.findOne({
      status: 'accepted',
      $or: [
        { patientId: currentUserId, acceptedDonorId: userId },
        { patientId: userId, acceptedDonorId: currentUserId }
      ]
    });
    
    if (!activeConnection) {
      return res.status(403).json({ 
        success: false, 
        message: 'No active tracking connection between these users' 
      });
    }
    
    // Get the user's current location
    const user = await User.findById(userId).select('name currentLocation');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      userId: user._id,
      name: user.name,
      location: user.currentLocation || null
    });
    
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;