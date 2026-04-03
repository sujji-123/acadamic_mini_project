import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, MapPin, Droplet, Heart, ShieldCheck, 
  BrainCircuit, Loader, AlertCircle, ArrowLeft, Navigation
} from 'lucide-react';

const FindDonors = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState([]);
  const [searchMethod, setSearchMethod] = useState('');
  const [requestingId, setRequestingId] = useState(null);
  
  // Search parameters
  const [bloodGroup, setBloodGroup] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState('We need your location to find nearby donors.');

  const BACKEND_URL = 'http://localhost:5000';

  // 1. On load, check if they came from the Landing Page
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to search for donors.");
      navigate('/login?redirect=/find-donors');
      return;
    }

    // Check for saved search params from Landing Page
    const savedParams = localStorage.getItem('bloodSearchParams');
    if (savedParams) {
      const parsed = JSON.parse(savedParams);
      if (parsed.bloodGroup) setBloodGroup(parsed.bloodGroup);
      localStorage.removeItem('bloodSearchParams'); // clear it after reading
    }

    // Automatically grab their GPS location for accurate Haversine/ML calculation
    getUserLocation();
  }, [navigate]);

  const getUserLocation = () => {
    setLocationStatus('Detecting your location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationStatus('Location acquired! Ready to search.');
        },
        (error) => {
          console.error(error);
          setLocationStatus('Location access denied. We will search without distance sorting.');
          // Default to 0,0 if they deny so the backend doesn't crash
          setLatitude(0);
          setLongitude(0);
        }
      );
    } else {
      setLocationStatus('Geolocation is not supported by your browser.');
      setLatitude(0);
      setLongitude(0);
    }
  };

  // 2. Perform the Smart Search
  const handleSearch = async () => {
    if (!bloodGroup) {
      alert('Please select a Blood Group');
      return;
    }
    if (latitude === null || longitude === null) {
      alert('Still acquiring location. Please wait a second.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Call the ML-powered endpoint we built in donors.js
      const response = await axios.post(`${BACKEND_URL}/api/donors/find-best-ml`, {
        bloodGroup: bloodGroup.toUpperCase(),
        latitude,
        longitude
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDonors(response.data.donors);
        setSearchMethod(response.data.method); // 'ml' or 'local'
      } else {
        setDonors([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to fetch donors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Send a DIRECT request to a specific donor
  const handleDirectRequest = async (donor) => {
    if (!window.confirm(`Send an emergency WhatsApp alert to ${donor.name}?`)) return;

    setRequestingId(donor.donorId || donor.id);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/requests/direct-request/${donor.donorId || donor.id}`, {
        bloodGroup: bloodGroup,
        latitude,
        longitude
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(response.data.message);
        // Take them back to dashboard to see the active request!
        navigate('/dashboard'); 
      }
    } catch (error) {
      alert('Failed to send direct request: ' + (error.response?.data?.message || error.message));
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Navigation & Header */}
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-red-600 mb-6 transition cursor-pointer">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-t-4 border-red-600">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Search className="h-6 w-6 mr-2 text-red-600" />
            Find Blood Donors
          </h1>
          <p className="text-gray-600 mb-6">Search for eligible donors nearby. Our system uses advanced ranking algorithms to find the best matches based on health history and distance.</p>
          
          {/* Search Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group Needed</label>
              <select 
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                <option value="">Select Group...</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
            
            <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center w-full">
                <Navigation className={`h-5 w-5 mr-2 ${latitude ? 'text-green-600' : 'text-gray-400 animate-pulse'}`} />
                <span className="text-sm text-gray-600">{locationStatus}</span>
              </div>
              
              <button 
                onClick={handleSearch}
                disabled={loading || latitude === null}
                className="w-full md:w-auto bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 flex items-center justify-center cursor-pointer shadow-md"
              >
                {loading ? <Loader className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
                {loading ? 'Searching...' : 'Find Matches'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {donors.length > 0 && (
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Found {donors.length} Matches</h2>
            
            {searchMethod === 'ml' ? (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm border border-purple-200">
                <BrainCircuit className="h-4 w-4 mr-1" /> AI Smart Ranked (IEEE)
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm border border-blue-200">
                <MapPin className="h-4 w-4 mr-1" /> Distance Ranked (Haversine)
              </span>
            )}
          </div>
        )}

        {/* The Donor List */}
        <div className="space-y-4">
          {donors.map((donor, index) => (
            <div key={donor.donorId || donor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                {/* Left Side: Donor Info */}
                <div className="flex items-start gap-4">
                  <div className="bg-red-50 p-4 rounded-lg text-center min-w-[80px]">
                    <Droplet className="h-6 w-6 text-red-600 mx-auto mb-1" />
                    <span className="font-bold text-red-700 block">{donor.bloodGroup}</span>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center">
                      {donor.name}
                      {donor.userType === 'blood_bank' && (
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded flex items-center">
                          <ShieldCheck className="h-3 w-3 mr-1"/> Blood Bank
                        </span>
                      )}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <p className="flex items-center"><MapPin className="h-3 w-3 mr-1"/> {donor.distance === 0 ? 'Very Close' : `${donor.distance} km away`}</p>
                      {donor.userType !== 'blood_bank' && (
                        <p className="flex items-center"><Heart className="h-3 w-3 mr-1"/> Past Donations: {donor.donationCount}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Score & Action Button */}
                <div className="flex flex-col items-end w-full md:w-auto">
                  <div className="text-right mb-3 w-full flex justify-between md:block">
                    <span className="text-sm text-gray-500 md:hidden">Eligibility Score:</span>
                    <p className="text-xs text-gray-500 mb-0.5 hidden md:block">Eligibility Score</p>
                    <div className="flex items-end justify-end gap-1">
                      <span className={`text-2xl font-bold ${donor.eligibilityScore > 75 ? 'text-green-600' : 'text-blue-600'}`}>
                        {donor.eligibilityScore}
                      </span>
                      <span className="text-sm text-gray-400 mb-1">/100</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDirectRequest(donor)}
                    disabled={requestingId === (donor.donorId || donor.id)}
                    className="w-full md:w-auto bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:bg-red-300 flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    {requestingId === (donor.donorId || donor.id) ? (
                      <><Loader className="h-4 w-4 animate-spin mr-2" /> Sending Alert...</>
                    ) : (
                      <><AlertCircle className="h-4 w-4 mr-2" /> Send Direct Request</>
                    )}
                  </button>
                </div>

              </div>
            </div>
          ))}

          {/* Empty State */}
          {donors.length === 0 && !loading && searchMethod !== '' && (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-700">No Donors Found</h3>
              <p className="text-gray-500 mt-1">There are no available donors with {bloodGroup} in our database right now.</p>
              <button onClick={() => navigate('/dashboard')} className="mt-4 text-red-600 font-semibold hover:underline">
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindDonors;