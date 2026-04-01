import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Droplet, Heart, MapPin, Clock, User, LogOut, Bell, Calendar, Loader,
  Navigation, ShieldCheck, Eye, Target, RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [trackingUsers, setTrackingUsers] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [selectedTracking, setSelectedTracking] = useState(null);
  const [trackedLocation, setTrackedLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const BACKEND_URL = 'http://localhost:5000';
  const ML_URL = 'http://localhost:8000';

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        
        
        if (response.data && response.data._id) {
          fetchActiveTrackings(token, response.data._id);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        if (error.response?.data?.isSpam) {
          alert('Your account has been flagged for suspicious activity. Please contact support.');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
      }
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const fetchActiveTrackings = async (token, userId) => {
    if (!userId) return;
    
    try {
      setTrackingLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/tracking/active/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setTrackingUsers(response.data.trackings || []);
      }
    } catch (error) {
      console.error('Error fetching trackings:', error);
      setTrackingUsers([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationSharing(true);
    setLocationError(null);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const token = localStorage.getItem('token');
          await axios.post(`${BACKEND_URL}/api/auth/update-location`, 
            { latitude, longitude },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Unable to get your location. Please enable location services.');
        setLocationSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);
  };

  const stopLocationSharing = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setLocationSharing(false);
  };

  const trackUserLocation = async (userId, userName) => {
    try {
      const token = localStorage.getItem('token');
      setSelectedTracking({ userId, userName });
      setTrackedLocation(null);
      
      const response = await axios.get(`${BACKEND_URL}/api/tracking/location/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.location) {
        setTrackedLocation(response.data.location);
      }
      
      if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
      }
      
      window.trackingInterval = setInterval(async () => {
        try {
          const refreshResponse = await axios.get(`${BACKEND_URL}/api/tracking/location/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (refreshResponse.data.location) {
            setTrackedLocation(refreshResponse.data.location);
          }
        } catch (err) {
          console.error('Error refreshing location:', err);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error tracking user:', error);
      alert('Unable to track this user. Make sure you have an active request connection.');
      setSelectedTracking(null);
    }
  };

  const stopTracking = () => {
    if (window.trackingInterval) {
      clearInterval(window.trackingInterval);
      window.trackingInterval = null;
    }
    setSelectedTracking(null);
    setTrackedLocation(null);
  };

  const handleEmergencyRequest = async () => {
    try {
      const defaultBg = user?.patientDetails?.bloodGroup || '';
      const bloodGroup = window.prompt("Confirm the Blood Group required (e.g., O+, A-, B+):", defaultBg);
      
      if (!bloodGroup) return; 

      setRequestLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${BACKEND_URL}/api/requests/emergency`, 
        { bloodGroup: bloodGroup.toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(response.data.message);
    } catch (error) {
      alert('Failed to send request: ' + (error.response?.data?.message || error.message));
    } finally {
      setRequestLoading(false);
    }
  };

  const handleFindDonors = () => {
    navigate('/find-donors');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
              <p className="text-gray-600 mt-1">{user.email} • {user.phone}</p>
              {user.isSpam && (
                <p className="text-red-600 text-sm mt-2 flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Account flagged for review - Limited functionality
                </p>
              )}
              {user.isVerified && !user.isSpam && (
                <p className="text-green-600 text-sm mt-2 flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Verified Account
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Droplet className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Blood Group</p>
                <p className="text-xl font-bold">
                  {user.userType === 'patient' 
                    ? user.patientDetails?.bloodGroup || 'Not set'
                    : user.donorDetails?.bloodGroup || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-xl font-bold">{user.location?.city || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-xl font-bold capitalize">{user.userType.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Trackings</p>
                <p className="text-xl font-bold">{trackingUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        
        <div className="grid md:grid-cols-3 gap-6">
          
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Details</h2>
              
              {user.userType.includes('donor') && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{user.donorDetails?.age || 'Not set'} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-medium">{user.donorDetails?.weight || 'Not set'} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hemoglobin</p>
                    <p className="font-medium">{user.donorDetails?.hemoglobin || 'Not set'} g/dL</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Donation</p>
                    <p className="font-medium">
                      {user.donorDetails?.lastDonationDate 
                        ? new Date(user.donorDetails.lastDonationDate).toLocaleDateString()
                        : 'Never donated'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Donations</p>
                    <p className="font-medium">{user.donorDetails?.donationCount || 0}</p>
                  </div>
                </div>
              )}

              {user.userType === 'blood_bank' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Registration No.</p>
                    <p className="font-medium">{user.bloodBankDetails?.registrationNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Established</p>
                    <p className="font-medium">{user.bloodBankDetails?.establishedYear || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Verification Status</p>
                    <p className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user.isVerified ? 'Verified' : 'Pending Verification'}
                    </p>
                  </div>
                </div>
              )}

              {user.userType === 'patient' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Blood Group Needed</p>
                    <p className="font-medium">{user.patientDetails?.bloodGroup || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Urgency Level</p>
                    <p className={`font-medium ${
                      user.patientDetails?.urgencyLevel === 'emergency' 
                        ? 'text-red-600' 
                        : user.patientDetails?.urgencyLevel === 'urgent'
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}>
                      {user.patientDetails?.urgencyLevel || 'Normal'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Navigation className="h-5 w-5 mr-2 text-red-600" />
                Location Sharing
              </h2>
              
              {!locationSharing ? (
                <button
                  onClick={startLocationSharing}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Start Sharing Location
                </button>
              ) : (
                <div>
                  <div className="bg-green-50 p-3 rounded-lg mb-3">
                    <p className="text-green-700 text-sm flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sharing live location...
                    </p>
                  </div>
                  <button
                    onClick={stopLocationSharing}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Stop Sharing
                  </button>
                </div>
              )}
              
              {locationError && (
                <p className="text-red-500 text-sm mt-2">{locationError}</p>
              )}
            </div>
          </div>

          
          <div className="md:col-span-2">
            
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {user.userType.includes('donor') && (
                  <>
                    <button className="p-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition">
                      <Heart className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Update Availability</span>
                    </button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">View Donation History</span>
                    </button>
                  </>
                )}

                {user.userType === 'patient' && (
                  <>
                    <button 
                      onClick={handleFindDonors}
                      className="p-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <Droplet className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Find Donors Now</span>
                    </button>
                    
                    <button 
                      onClick={handleEmergencyRequest}
                      disabled={requestLoading}
                      className="p-4 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition flex flex-col items-center"
                    >
                      {requestLoading ? (
                        <Loader className="h-6 w-6 mx-auto mb-2 animate-spin" />
                      ) : (
                        <Bell className="h-6 w-6 mx-auto mb-2" />
                      )}
                      <span className="block font-medium">
                        {requestLoading ? 'Alerting Donors...' : 'Emergency Request'}
                      </span>
                    </button>
                  </>
                )}

                {user.userType === 'blood_bank' && (
                  <>
                    <button className="p-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition">
                      <Droplet className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Update Inventory</span>
                    </button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <User className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Manage Requests</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-red-600" />
                Live Tracking
              </h2>
              
              {trackingUsers.length > 0 && !selectedTracking && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Active connections:</p>
                  {trackingUsers.map((tracking) => (
                    <div key={tracking.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{tracking.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{tracking.type}</p>
                      </div>
                      <button
                        onClick={() => trackUserLocation(tracking.userId, tracking.name)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                      >
                        Track Location
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedTracking && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Tracking: {selectedTracking.userName}</h3>
                    <button
                      onClick={stopTracking}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Stop Tracking
                    </button>
                  </div>
                  
                  {trackedLocation ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <MapPin className="h-5 w-5 text-red-600 mr-2" />
                        <span className="font-medium">Current Location</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        Latitude: {trackedLocation.lat?.toFixed(6)}
                      </p>
                      <p className="text-sm text-gray-700">
                        Longitude: {trackedLocation.lng?.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {trackedLocation.timestamp 
                          ? new Date(trackedLocation.timestamp).toLocaleTimeString()
                          : 'Just now'}
                      </p>
                      <button
                        onClick={() => {
                          window.open(`https://www.google.com/maps?q=${trackedLocation.lat},${trackedLocation.lng}`, '_blank');
                        }}
                        className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        View on Map
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader className="h-8 w-8 animate-spin text-red-600 mx-auto mb-2" />
                      <p className="text-gray-500">Fetching location...</p>
                    </div>
                  )}
                </div>
              )}

              {trackingUsers.length === 0 && !selectedTracking && (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No active tracking connections</p>
                  <p className="text-sm text-gray-400 mt-1">
                    When a donor accepts your request or you accept a request, you'll be able to track each other's location
                  </p>
                </div>
              )}

              {trackingLoading && (
                <div className="flex justify-center py-4">
                  <Loader className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <p className="text-gray-500 text-center py-8">No recent activity to show</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;