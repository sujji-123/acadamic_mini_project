import React, { useState } from 'react';
import axios from 'axios';
import { Building2, Phone, Mail, MapPin, Lock, CheckCircle, AlertCircle, Loader, Navigation } from 'lucide-react';

const AdminAddHospital = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    adminSecret: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    lat: '',
    lng: ''
  });

  const BACKEND_URL = 'http://localhost:5000';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Automatically fetch admin's current GPS location to simulate hospital location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          alert("Coordinates acquired successfully!");
        },
        (error) => {
          alert("Error getting location. Please enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register-hospital`, {
        adminSecret: formData.adminSecret,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: {
          address: formData.address,
          city: formData.city,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng)
        }
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        // Clear form after success except secret key
        setFormData({
          adminSecret: formData.adminSecret,
          name: '', email: '', phone: '', address: '', city: '', lat: '', lng: ''
        });
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Server error while adding hospital.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl border-t-8 border-red-600">
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Admin Portal</h2>
          <p className="mt-2 text-sm text-gray-600">Secure Hospital & Transplant Center Registration</p>
        </div>

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Secret Key */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-1">Master Admin Key</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="adminSecret"
                type="password"
                required
                value={formData.adminSecret}
                onChange={handleChange}
                className="pl-10 appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm font-mono"
                placeholder="Enter IEEE_ADMIN_2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  name="name" type="text" required value={formData.name} onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g. City General Hospital"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  name="email" type="email" required value={formData.email} onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  placeholder="hospital@example.com"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Emergency Number (Real)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  name="phone" type="text" required value={formData.phone} onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g. 9876543210 (Must be your number for testing)"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">The system will send the Organ Request alert to this number.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                name="address" type="text" required value={formData.address} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Street name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                name="city" type="text" required value={formData.city} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="City"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-blue-800 flex items-center">
                <MapPin className="h-4 w-4 mr-1" /> GPS Coordinates
              </label>
              <button 
                type="button" 
                onClick={handleGetLocation}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition flex items-center cursor-pointer"
              >
                <Navigation className="h-3 w-3 mr-1" /> Auto-Fill Location
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                name="lat" type="number" step="any" required value={formData.lat} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Latitude"
              />
              <input
                name="lng" type="number" step="any" required value={formData.lng} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Longitude"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition cursor-pointer"
          >
            {loading ? <Loader className="h-5 w-5 animate-spin" /> : "Securely Register Hospital"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAddHospital;