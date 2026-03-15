import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Droplet, User, Mail, Phone, MapPin, Lock, Heart, DollarSign } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: {
      address: '',
      city: '',
      pincode: ''
    },
    
    // Donor fields
    donorDetails: {
      bloodGroup: '',
      age: '',
      weight: '',
      hemoglobin: '',
      diseases: '',
      lastDonationDate: '',
      isAvailable: true,
      expectedAmount: ''
    },
    
    // Blood bank fields
    bloodBankDetails: {
      registrationNumber: '',
      licenseNumber: '',
      establishedYear: '',
      totalUnitsAvailable: {
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
        'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0
      }
    },
    
    // Patient fields
    patientDetails: {
      bloodGroup: '',
      urgencyLevel: 'normal'
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name.includes('[')) {
      // Handle blood bank units
      const match = name.match(/\[(.*?)\]/);
      if (match) {
        const bloodGroup = match[1];
        setFormData(prev => ({
          ...prev,
          bloodBankDetails: {
            ...prev.bloodBankDetails,
            totalUnitsAvailable: {
              ...prev.bloodBankDetails.totalUnitsAvailable,
              [bloodGroup]: parseInt(value) || 0
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.phone) newErrors.phone = 'Phone is required';
    
    // Donor specific validations
    if (userType.includes('donor')) {
      if (!formData.donorDetails.bloodGroup) newErrors.bloodGroup = 'Blood group required';
      if (!formData.donorDetails.age) newErrors.age = 'Age required';
      if (formData.donorDetails.age < 18 || formData.donorDetails.age > 60) {
        newErrors.age = 'Age must be between 18 and 60';
      }
      if (!formData.donorDetails.weight) newErrors.weight = 'Weight required';
      if (formData.donorDetails.weight < 45) {
        newErrors.weight = 'Minimum weight should be 45kg';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        ...formData,
        userType
      });
      
      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      alert('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // User Type Selection Screen
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-8">Join as a</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Individual Donor (Free) */}
            <button
              onClick={() => handleUserTypeSelect('individual_donor')}
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition text-center group"
            >
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-600 group-hover:text-white transition">
                <Heart className="h-8 w-8 text-red-600 group-hover:text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Individual Donor</h3>
              <p className="text-sm text-gray-600">Donate blood freely to help others</p>
            </button>

            {/* Paid Donor */}
            <button
              onClick={() => handleUserTypeSelect('paid_donor')}
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition text-center group"
            >
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:text-white transition">
                <DollarSign className="h-8 w-8 text-green-600 group-hover:text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Paid Donor</h3>
              <p className="text-sm text-gray-600">Receive compensation for donation</p>
            </button>

            {/* Blood Bank */}
            <button
              onClick={() => handleUserTypeSelect('blood_bank')}
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition text-center group"
            >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                <Droplet className="h-8 w-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Blood Bank</h3>
              <p className="text-sm text-gray-600">Register your organization</p>
            </button>

            {/* Patient */}
            <button
              onClick={() => handleUserTypeSelect('patient')}
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition text-center group"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                <User className="h-8 w-8 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Patient</h3>
              <p className="text-sm text-gray-600">Need blood urgently</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Complete Registration</h2>
            <button 
              onClick={() => setStep(1)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Change Type
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields - Always Show */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Chennai"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Full address"
                />
              </div>
            </div>

            {/* Donor Specific Fields */}
            {(userType === 'individual_donor' || userType === 'paid_donor') && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Donor Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                    <select
                      name="donorDetails.bloodGroup"
                      value={formData.donorDetails.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Blood Group</option>
                      {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                    {errors.bloodGroup && <p className="text-red-500 text-sm mt-1">{errors.bloodGroup}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="donorDetails.age"
                      value={formData.donorDetails.age}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="25"
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="donorDetails.weight"
                      value={formData.donorDetails.weight}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="70"
                    />
                    {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hemoglobin (g/dL)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="donorDetails.hemoglobin"
                      value={formData.donorDetails.hemoglobin}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="13.5"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Any Diseases/Medical Conditions</label>
                    <input
                      type="text"
                      name="donorDetails.diseases"
                      value={formData.donorDetails.diseases}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="None, or list any conditions"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date</label>
                    <input
                      type="date"
                      name="donorDetails.lastDonationDate"
                      value={formData.donorDetails.lastDonationDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {userType === 'paid_donor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Amount (₹)</label>
                      <input
                        type="number"
                        name="donorDetails.expectedAmount"
                        value={formData.donorDetails.expectedAmount}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="1000"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blood Bank Specific Fields */}
            {userType === 'blood_bank' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Blood Bank Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                    <input
                      type="text"
                      name="bloodBankDetails.registrationNumber"
                      value={formData.bloodBankDetails.registrationNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text"
                      name="bloodBankDetails.licenseNumber"
                      value={formData.bloodBankDetails.licenseNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                    <input
                      type="number"
                      name="bloodBankDetails.establishedYear"
                      value={formData.bloodBankDetails.establishedYear}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="font-medium mb-2">Units Available</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                        <div key={bg}>
                          <label className="block text-sm text-gray-600">{bg}</label>
                          <input
                            type="number"
                            name={`bloodBankDetails.totalUnitsAvailable[${bg}]`}
                            value={formData.bloodBankDetails.totalUnitsAvailable[bg]}
                            onChange={handleChange}
                            className="w-full px-2 py-1 border rounded"
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Specific Fields */}
            {userType === 'patient' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Patient Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group Needed</label>
                    <select
                      name="patientDetails.bloodGroup"
                      value={formData.patientDetails.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Blood Group</option>
                      {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                    <select
                      name="patientDetails.urgencyLevel"
                      value={formData.patientDetails.urgencyLevel}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold disabled:bg-gray-400"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              
              <p className="text-center mt-4 text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;