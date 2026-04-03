import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Heart, ShieldAlert, Building2, PhoneCall, 
  AlertCircle, ArrowLeft, Navigation, Activity, CheckCircle
} from 'lucide-react';

const FindOrgans = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [hospitalsFound, setHospitalsFound] = useState([]);
  
  // Search parameters
  const [organType, setOrganType] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Acquiring secure location data...');

  const BACKEND_URL = 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in to access the Organ Transplant Network.");
      navigate('/login?redirect=/find-organs');
      return;
    }

    // Read parameters from landing page
    const savedParams = localStorage.getItem('organSearchParams');
    if (savedParams) {
      const parsed = JSON.parse(savedParams);
      if (parsed.organType) setOrganType(parsed.organType);
      localStorage.removeItem('organSearchParams');
    }

    // Capture GPS data for Haversine sorting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocationStatus('Location secured. Connecting to Regional Transplant Network.');
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationStatus('Location access denied. Connecting without distance sorting.');
          setLatitude(0);
          setLongitude(0);
        }
      );
    } else {
      setLocationStatus('Geolocation is not supported. Connecting without distance sorting.');
      setLatitude(0);
      setLongitude(0);
    }

  }, [navigate]);

  // THE UPDATED EMERGENCY REQUEST BUTTON LOGIC
  const handleEmergencyOrganRequest = async () => {
    if (!organType) {
      alert('Please specify the required organ.');
      return;
    }
    
    if (latitude === null || longitude === null) {
      alert('Still acquiring secure location. Please wait a second.');
      return;
    }

    if (!window.confirm(`WARNING: You are about to broadcast an emergency request for a ${organType} transplant to all regional hospitals. Proceed?`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Hits the REAL database search endpoint in request.js
      const response = await axios.post(`${BACKEND_URL}/api/requests/organ-emergency`, {
        organType: organType,
        latitude: latitude,
        longitude: longitude
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRequestSent(true);
        // Display the actual hospitals found in the database
        setHospitalsFound(response.data.notifiedHospitals || []);
        alert(response.data.message);
      }
    } catch (error) {
      // If the database has no hospitals registered, it catches the 404 error here
      if (error.response && error.response.status === 404) {
        alert("Action Required: " + error.response.data.message);
      } else {
        alert('Failed to broadcast request: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4">
        
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-red-600 mb-6 transition cursor-pointer">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>

        {/* Medical Protocol Warning Box */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-t-4 border-blue-600">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Organ Transplant Network
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-800">Medical Protocol Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Organ matching is a highly regulated medical procedure. Direct peer-to-peer organ donation requests are not legally permissible. Your request will be securely broadcasted to Authorized Transplant Centers and the State Organ Sharing Network for official medical evaluation.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center mt-6">
            <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center w-full">
              <Navigation className={`h-5 w-5 mr-2 ${latitude ? 'text-green-600' : 'text-blue-600 animate-pulse'}`} />
              <span className="text-sm text-gray-600">{locationStatus}</span>
            </div>
            <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center w-full">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              <span className="text-sm font-bold text-gray-800">Organ Required: {organType || 'Not Specified'}</span>
            </div>
          </div>
        </div>

        {/* Success State OR Action State */}
        {requestSent ? (
          <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Emergency Broadcast Successful</h2>
            <p className="text-green-700 max-w-lg mx-auto mb-6">
              Your urgent request for a {organType} has been successfully transmitted via the backend API to the following registered medical centers.
            </p>
            
            {/* Dynamically list the actual hospitals from the DB that were notified */}
            <div className="max-w-md mx-auto bg-white rounded-lg border border-green-200 overflow-hidden mb-6 text-left">
              <div className="bg-green-100 px-4 py-2 font-bold text-green-800 border-b border-green-200">
                Notified Database Hospitals:
              </div>
              <ul className="divide-y divide-gray-100">
                {hospitalsFound.map((hosp, idx) => (
                  <li key={idx} className="px-4 py-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-blue-500" /> {hosp.name}
                    </span>
                    <span className="text-sm text-gray-500">{hosp.distance.toFixed(1)} km</span>
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={() => navigate('/dashboard')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition cursor-pointer font-bold">
              Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">System Integration Check</h2>
              <p className="text-sm text-gray-500">
                Clicking the button below will search the database for `userType: 'hospital'` and trigger the backend WhatsApp alerting engine to those registered phone numbers.
              </p>
            </div>

            {/* THE EMERGENCY REQUEST BUTTON */}
            <button 
              onClick={handleEmergencyOrganRequest}
              disabled={loading || latitude === null}
              className="w-full bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition disabled:bg-gray-400 flex items-center justify-center cursor-pointer shadow-lg mt-6"
            >
              {loading ? (
                <><Activity className="h-6 w-6 animate-spin mr-2" /> Searching Database & Broadcasting...</>
              ) : (
                <><AlertCircle className="h-6 w-6 mr-2" /> EXECUTE EMERGENCY BROADCAST</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FindOrgans;