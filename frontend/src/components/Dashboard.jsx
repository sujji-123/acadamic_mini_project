import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Droplet, Heart, MapPin, Clock, User, LogOut, Bell, Calendar, Loader,
  Navigation, ShieldCheck, Eye, Target, RefreshCw, CheckCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // States for active requests and UI modals
  const [activeRequests, setActiveRequests] = useState([]);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [isAvailableToggle, setIsAvailableToggle] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryBg, setInventoryBg] = useState('');
  const [inventoryUnits, setInventoryUnits] = useState(0);

  // State to control how many requests are visible at once (Pagination UI)
  const [visibleRequestsCount, setVisibleRequestsCount] = useState(3);

  // FIX: Removed process.env. Vite doesn't support it in the browser!
  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchUserData();
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [navigate]);

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
      if (response.data.donorDetails) {
          setIsAvailableToggle(response.data.donorDetails.isAvailable);
      }
      
      // Fetch active requests
      fetchMyRequests(token);

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

  const fetchMyRequests = async (token) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        // Ensure we always set an array, even if requests is undefined
        setActiveRequests(Array.isArray(response.data.requests) ? response.data.requests : []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setActiveRequests([]); // Fallback to empty array on error
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // ==========================================
  // LOCATION SHARING LOGIC
  // ==========================================
  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationSharing(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const token = localStorage.getItem('token');
              await axios.post(`${BACKEND_URL}/api/auth/update-location`, 
                { latitude, longitude },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log("Location initially updated.");
            } catch (error) {
              console.error('Error updating location:', error);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationError('Unable to get your location right now.');
            setLocationSharing(false);
          }
    );

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
          console.error('Error updating live location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
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

  // ==========================================
  // PATIENT ACTIONS
  // ==========================================
  const handleEmergencyRequest = async () => {
    try {
      const defaultBg = user?.patientDetails?.bloodGroup || '';
      const bloodGroup = window.prompt("Confirm the Blood Group required (e.g., O+, A-, B+):", defaultBg);
      
      if (!bloodGroup) return; 

      navigator.geolocation.getCurrentPosition(async (position) => {
          setRequestLoading(true);
          const token = localStorage.getItem('token');
          
          try {
            const response = await axios.post(`${BACKEND_URL}/api/requests/emergency`, 
                { 
                    bloodGroup: bloodGroup.toUpperCase(),
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(response.data.message);
            fetchMyRequests(token); 
          } catch(err) {
            alert('Failed to send request: ' + (err.response?.data?.message || err.message));
          } finally {
            setRequestLoading(false);
          }
      }, (error) => {
          alert("Please allow location access to send an emergency request.");
      });
      
    } catch (error) {
        console.error("Error setting up request", error);
    }
  };

  const handleClearRequest = async (requestId) => {
      if(!window.confirm("Are you sure you want to mark this request as completed and clear it?")) return;
      
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${BACKEND_URL}/api/requests/complete/${requestId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setActiveRequests(prev => Array.isArray(prev) ? prev.filter(req => req._id !== requestId) : []);
        alert("Request marked as completed!");
      } catch (error) {
        alert("Failed to clear request.");
      }
  };

  const handleFindDonors = () => {
    navigate('/find-donors'); 
  };

  // ==========================================
  // DONOR ACTIONS
  // ==========================================
  const toggleAvailability = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${BACKEND_URL}/api/donors/availability`, 
            { isAvailable: !isAvailableToggle },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsAvailableToggle(!isAvailableToggle);
        alert(response.data.message);
        setShowAvailabilityModal(false);
        fetchUserData();
    } catch(err) {
        alert("Failed to update availability.");
    }
  };

  // ==========================================
  // BLOOD BANK ACTIONS
  // ==========================================
  const updateInventory = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${BACKEND_URL}/api/donors/inventory`, 
            { bloodGroup: inventoryBg, units: inventoryUnits },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Inventory Updated Successfully");
        setShowInventoryModal(false);
        fetchUserData();
      } catch(err) {
          alert("Failed to update inventory.");
      }
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

  // SAFETY FIX: Ensure activeRequests is ALWAYS treated as an Array before slicing
  const safeRequests = Array.isArray(activeRequests) ? activeRequests : [];
  
  // Calculate which requests to display based on visibleRequestsCount
  const visibleRequests = safeRequests.slice(0, visibleRequestsCount);
  const hasMoreRequests = safeRequests.length > visibleRequestsCount;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 relative">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
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
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
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
                <p className="text-sm text-gray-600">Active Requests</p>
                <p className="text-xl font-bold">{safeRequests.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Profile & Location Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Details</h2>
              
              {user.userType.includes('donor') && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Availability</p>
                    <p className={`font-medium ${user.donorDetails?.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {user.donorDetails?.isAvailable ? 'Available to Donate' : 'Unavailable'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{user.donorDetails?.age || 'Not set'} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-medium">{user.donorDetails?.weight || 'Not set'} kg</p>
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
                    <p className="font-medium text-red-600">
                      {user.patientDetails?.urgencyLevel || 'Normal'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location Sharing Box */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Navigation className="h-5 w-5 mr-2 text-red-600" />
                Live Location Sharing
              </h2>
              <p className="text-xs text-gray-500 mb-4">Share your location so the donor/patient can find you easily when connected.</p>
              
              {!locationSharing ? (
                <button
                  onClick={startLocationSharing}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center cursor-pointer"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Turn On Location
                </button>
              ) : (
                <div>
                  <div className="bg-green-50 p-3 rounded-lg mb-3">
                    <p className="text-green-700 text-sm flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Live Location is ON
                    </p>
                  </div>
                  <button
                    onClick={stopLocationSharing}
                    className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition cursor-pointer"
                  >
                    Turn Off Location
                  </button>
                </div>
              )}
              
              {locationError && (
                <p className="text-red-500 text-sm mt-2">{locationError}</p>
              )}
            </div>
          </div>

          
          {/* Main Actions & Activity */}
          <div className="md:col-span-2">
            
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Donor Buttons */}
                {user.userType.includes('donor') && (
                  <>
                    <button onClick={() => setShowAvailabilityModal(true)} className="p-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer">
                      <Heart className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Update Availability</span>
                    </button>
                    <button onClick={() => setShowHistoryModal(true)} className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                      <Calendar className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">View Donation History</span>
                    </button>
                  </>
                )}

                {/* Patient Buttons */}
                {user.userType === 'patient' && (
                  <>
                    <button 
                      onClick={handleFindDonors}
                      className="p-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                    >
                      <Droplet className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Search & Find Donors</span>
                    </button>
                    
                    <button 
                      onClick={handleEmergencyRequest}
                      disabled={requestLoading}
                      className="p-4 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition flex flex-col items-center cursor-pointer"
                    >
                      {requestLoading ? (
                        <Loader className="h-6 w-6 mx-auto mb-2 animate-spin" />
                      ) : (
                        <Bell className="h-6 w-6 mx-auto mb-2" />
                      )}
                      <span className="block font-medium">
                        {requestLoading ? 'Alerting Donors...' : 'Emergency SOS Request'}
                      </span>
                    </button>
                  </>
                )}

                {/* Blood Bank Buttons */}
                {user.userType === 'blood_bank' && (
                  <>
                    <button onClick={() => setShowInventoryModal(true)} className="p-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer">
                      <Droplet className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Update Inventory</span>
                    </button>
                    <button onClick={() => navigate('/find-donors')} className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                      <User className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Find Donors</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Active Requests Box (Tracking) */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Target className="h-5 w-5 mr-2 text-red-600" />
                  Active Requests & Connections
                </h2>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  Total: {safeRequests.length}
                </span>
              </div>
              
              {safeRequests.length > 0 ? (
                <div className="space-y-4">
                  {/* Map through the VISIBLE requests only */}
                  {visibleRequests.map((req) => (
                    <div key={req._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Droplet className="h-4 w-4 text-red-600" />
                                    Request for {req.bloodGroup}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Status: <span className={req.status === 'fulfilled' ? 'text-green-600 font-semibold' : 'text-orange-500 font-semibold'}>{req.status.toUpperCase()}</span></p>
                                
                                {req.acceptedDonorId && (
                                    <div className="mt-3 bg-green-100 p-3 rounded-md text-sm border border-green-200">
                                        <p className="font-bold text-green-800 flex items-center mb-1">
                                            <CheckCircle className="h-4 w-4 mr-1" /> Match Found!
                                        </p>
                                        <p className="text-gray-700">Name: <span className="font-semibold">{req.acceptedDonorId.name}</span></p>
                                        <p className="text-gray-700">Phone: <span className="font-semibold">{req.acceptedDonorId.phone}</span></p>
                                        {req.acceptedDonorId.location?.coordinates && (
                                            <a 
                                              href={`https://www.google.com/maps/dir/?api=1&destination=${req.acceptedDonorId.location.coordinates.lat},${req.acceptedDonorId.location.coordinates.lng}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-blue-600 hover:text-blue-800 font-medium text-xs mt-2 inline-flex items-center"
                                            >
                                                <MapPin className="h-3 w-3 mr-1"/> Track / Get Directions to Donor
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {user.userType === 'patient' && (
                                <button 
                                  onClick={() => handleClearRequest(req._id)}
                                  className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 py-1.5 px-3 rounded flex items-center cursor-pointer shadow-sm transition"
                                >
                                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" /> Mark Complete
                                </button>
                            )}
                        </div>
                    </div>
                  ))}

                  {/* UI Pagination Controls */}
                  <div className="flex justify-center mt-4 pt-2 border-t border-gray-100">
                    {hasMoreRequests ? (
                      <button 
                        onClick={() => setVisibleRequestsCount(prev => prev + 3)}
                        className="flex items-center text-sm font-semibold text-red-600 hover:text-red-800 transition cursor-pointer"
                      >
                        View More Requests <ChevronDown className="h-4 w-4 ml-1" />
                      </button>
                    ) : visibleRequestsCount > 3 ? (
                      <button 
                        onClick={() => setVisibleRequestsCount(3)}
                        className="flex items-center text-sm font-semibold text-gray-500 hover:text-gray-700 transition cursor-pointer"
                      >
                        Show Less <ChevronUp className="h-4 w-4 ml-1" />
                      </button>
                    ) : null}
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No active connections right now.</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                    When you send a request and a donor accepts, their details and live location link will appear here.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Availability Modal */}
      {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
                  <button onClick={() => setShowAvailabilityModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer">
                      <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold mb-4">Update Availability</h2>
                  <p className="text-gray-600 mb-6 text-sm">Let patients know if you are currently able to donate blood.</p>
                  
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border mb-6">
                      <span className="font-semibold">Current Status:</span>
                      <span className={`font-bold ${isAvailableToggle ? 'text-green-600' : 'text-red-600'}`}>
                          {isAvailableToggle ? 'Available' : 'Unavailable'}
                      </span>
                  </div>

                  <button 
                    onClick={toggleAvailability}
                    className={`w-full py-3 rounded-lg font-bold text-white transition cursor-pointer ${isAvailableToggle ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                      {isAvailableToggle ? 'Mark as Unavailable' : 'Mark as Available'}
                  </button>
              </div>
          </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md relative">
                  <button onClick={() => setShowHistoryModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer">
                      <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold mb-4">Donation History</h2>
                  
                  <div className="bg-red-50 p-4 rounded-lg mb-4 text-center border border-red-100">
                      <p className="text-3xl font-bold text-red-600">{user.donorDetails?.donationCount || 0}</p>
                      <p className="text-sm text-gray-600 font-medium">Total Life-Saving Donations</p>
                  </div>

                  <div className="text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="flex justify-between border-b pb-2 mb-2">
                        <strong className="text-gray-700">Last Donation Date:</strong> 
                        <span className="font-medium text-gray-900">
                          {user.donorDetails?.lastDonationDate ? new Date(user.donorDetails.lastDonationDate).toLocaleDateString() : 'No records yet'}
                        </span>
                      </p>
                      <p className="mt-2 text-xs italic text-orange-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> Note: You must wait 90 days between donations.
                      </p>
                  </div>

                  <button onClick={() => setShowHistoryModal(false)} className="w-full bg-gray-800 text-white py-2 rounded-lg mt-2 hover:bg-gray-900 transition cursor-pointer font-medium">
                    Close History
                  </button>
              </div>
          </div>
      )}

      {/* Inventory Modal (Blood Bank) */}
      {showInventoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-96 relative">
                  <button onClick={() => setShowInventoryModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer">
                      <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Droplet className="h-5 w-5 mr-2 text-red-600"/> Update Inventory
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                          <select 
                            value={inventoryBg} 
                            onChange={(e) => setInventoryBg(e.target.value)}
                            className="w-full border-gray-300 rounded-lg p-3 border focus:ring-red-500 focus:border-red-500 outline-none"
                          >
                              <option value="">Select Group...</option>
                              <option value="A+">A+</option>
                              <option value="O+">O+</option>
                              <option value="B+">B+</option>
                              <option value="AB+">AB+</option>
                              <option value="A-">A-</option>
                              <option value="O-">O-</option>
                              <option value="B-">B-</option>
                              <option value="AB-">AB-</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Units Available</label>
                          <input 
                            type="number" 
                            min="0"
                            value={inventoryUnits}
                            onChange={(e) => setInventoryUnits(e.target.value)}
                            className="w-full border-gray-300 rounded-lg p-3 border focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="Enter quantity"
                          />
                      </div>
                  </div>

                  <button 
                    onClick={updateInventory}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-bold transition cursor-pointer"
                  >
                      Save Inventory
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;