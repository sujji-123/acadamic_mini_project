import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Droplet, Heart, MapPin, Clock, User, LogOut, Bell, Calendar, Loader
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false); // NEW STATE

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // NEW FUNCTION: Handle Emergency Request Click
  const handleEmergencyRequest = async () => {
    try {
      // Prompt patient to confirm the blood group they need
      const defaultBg = user.patientDetails?.bloodGroup || '';
      const bloodGroup = window.prompt("Confirm the Blood Group required (e.g., O+, A-, B+):", defaultBg);
      
      if (!bloodGroup) return; // User cancelled

      setRequestLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post('http://localhost:5000/api/requests/emergency', 
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
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
              <p className="text-gray-600 mt-1">{user.email} • {user.phone}</p>
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
                <p className="text-sm text-gray-600">Requests</p>
                <p className="text-xl font-bold">0 pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
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
                    <button className="p-4 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition">
                      <Droplet className="h-6 w-6 mx-auto mb-2" />
                      <span className="block font-medium">Find Donors Now</span>
                    </button>
                    
                    {/* MODIFIED EMERGENCY BUTTON */}
                    <button 
                      onClick={handleEmergencyRequest}
                      disabled={requestLoading}
                      className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition flex flex-col items-center"
                    >
                      {requestLoading ? (
                        <Loader className="h-6 w-6 mx-auto mb-2 animate-spin text-gray-600" />
                      ) : (
                        <Bell className="h-6 w-6 mx-auto mb-2 text-gray-800" />
                      )}
                      <span className="block font-medium text-gray-800">
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