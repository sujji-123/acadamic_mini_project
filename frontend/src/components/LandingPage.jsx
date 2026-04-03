import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Droplet, 
  MapPin, 
  Heart, 
  Clock, 
  Shield, 
  Phone,
  Users,
  Award,
  AlertCircle,
  Activity,
  Stethoscope,
  ChevronRight,
  User,
  Calendar,
  Bell,
  LogOut,
  Menu,
  X,
  Mail,
  Lock
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('blood');
  const [location, setLocation] = React.useState('');
  const [bloodGroup, setBloodGroup] = React.useState('');
  const [organType, setOrganType] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);

  const handleBloodSearch = async () => {
    if (!location) {
      alert('Please enter your location');
      return;
    }
    if (!bloodGroup) {
      alert('Please select blood group');
      return;
    }
    
    setSearchLoading(true);
    try {
      localStorage.setItem('bloodSearchParams', JSON.stringify({
        location,
        bloodGroup,
        type: 'blood'
      }));
      navigate('/find-donors');
    } catch (error) {
      console.error('Search error:', error);
      alert('Unable to search. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOrganSearch = async () => {
    if (!location) {
      alert('Please enter your location');
      return;
    }
    if (!organType) {
      alert('Please select organ type');
      return;
    }
    
    setSearchLoading(true);
    try {
      localStorage.setItem('organSearchParams', JSON.stringify({
        location,
        organType,
        type: 'organ'
      }));
      navigate('/find-organs');
    } catch (error) {
      console.error('Search error:', error);
      alert('Unable to search. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRequestClick = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login?redirect=/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
                Find Blood Donors & <br className="hidden xs:block" />Organ Matches Instantly
              </h1>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-red-100">
                Connect with blood donors and organ donors in real-time. 
                Save lives with our smart matching system for blood transfusion and organ transplantation.
              </p>
              
              {/* Search Card */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl mb-6 sm:mb-8">
                <div className="flex gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('blood')}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'blood'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Droplet className="h-4 w-4 sm:h-5 sm:w-5" />
                    Need Blood
                  </button>
                  <button
                    onClick={() => setActiveTab('organs')}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === 'organs'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                    Need Organ
                  </button>
                </div>

                {activeTab === 'blood' && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Need Blood Urgently?</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <input 
                        type="text" 
                        placeholder="Enter your location" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-800 text-sm sm:text-base"
                      />
                      <select 
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-800 text-sm sm:text-base outline-none"
                      >
                        <option value="">Select Blood Group</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>O+</option>
                        <option>O-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                      </select>
                      <button 
                        onClick={handleBloodSearch}
                        disabled={searchLoading}
                        className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 font-semibold disabled:bg-red-400 cursor-pointer text-sm sm:text-base"
                      >
                        {searchLoading ? 'Searching...' : 'Find Donors'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'organs' && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Need Organ Donation?</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <input 
                        type="text" 
                        placeholder="Enter your location" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-800 text-sm sm:text-base"
                      />
                      <select 
                        value={organType}
                        onChange={(e) => setOrganType(e.target.value)}
                        className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-800 text-sm sm:text-base outline-none"
                      >
                        <option value="">Select Organ Needed</option>
                        <option>Kidney</option>
                        <option>Liver</option>
                        <option>Heart</option>
                        <option>Lungs</option>
                        <option>Pancreas</option>
                        <option>Cornea (Eyes)</option>
                        <option>Bone Marrow</option>
                        <option>Skin</option>
                      </select>
                      <button 
                        onClick={handleOrganSearch}
                        disabled={searchLoading}
                        className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 font-semibold disabled:bg-red-400 cursor-pointer text-sm sm:text-base"
                      >
                        {searchLoading ? 'Searching...' : 'Find Organ Donors'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 sm:mt-3">
                      ⚠️ Organ matching requires medical evaluation and compatibility testing
                    </p>
                  </div>
                )}
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">500+</div>
                  <div className="text-xs sm:text-sm text-red-100">Blood Donors</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">50+</div>
                  <div className="text-xs sm:text-sm text-red-100">Organ Donors</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">150+</div>
                  <div className="text-xs sm:text-sm text-red-100">Lives Saved</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold">24/7</div>
                  <div className="text-xs sm:text-sm text-red-100">Emergency Support</div>
                </div>
              </div>
            </div>
            
            {/* Hero Image - Hidden on mobile */}
            <div className="hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Blood Donation"
                className="rounded-lg shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How Our Platform Works</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6">
              <div className="bg-red-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">1. Register</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Donors register with their blood group, organ donation preferences, location, and health details.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6">
              <div className="bg-red-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">2. Find Matches</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Our system finds eligible blood donors OR organ donors within your area using smart matching algorithms.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="bg-red-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">3. Connect & Save</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Contact the donor directly. Track their location in real-time until they reach for blood or organ donation.
              </p>
            </div>
          </div>

          {/* Process Flow - Responsive */}
          <div className="mt-12 sm:mt-16 bg-gray-50 p-6 sm:p-8 rounded-xl">
            <h3 className="text-lg sm:text-xl font-semibold mb-6 text-center">Simple Process</h3>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
              <div className="flex items-center w-full sm:w-auto justify-center">
                <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                  <span className="font-bold text-green-600 text-sm sm:text-base">Patient</span>
                </div>
                <div className="ml-2 text-sm sm:text-base">→ Requests Blood/Organ</div>
              </div>
              <Droplet className="text-red-600 h-5 w-5 sm:h-6 sm:w-6 hidden sm:block" />
              <div className="flex items-center w-full sm:w-auto justify-center">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                  <span className="font-bold text-blue-600 text-sm sm:text-base">System</span>
                </div>
                <div className="ml-2 text-sm sm:text-base">→ Finds Matches</div>
              </div>
              <Droplet className="text-red-600 h-5 w-5 sm:h-6 sm:w-6 hidden sm:block" />
              <div className="flex items-center w-full sm:w-auto justify-center">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                  <span className="font-bold text-purple-600 text-sm sm:text-base">Donor</span>
                </div>
                <div className="ml-2 text-sm sm:text-base">→ Accepts & Helps</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      <section id="guidelines" className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Donation Guidelines</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Blood Donation */}
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Droplet className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
                <h3 className="text-lg sm:text-xl font-semibold">Blood Donation</h3>
              </div>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Age: 18-60 years</span>
                </li>
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Weight: ≥ 50 kg</span>
                </li>
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Hemoglobin: ≥ 12.5 g/dL</span>
                </li>
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>90 days gap between donations</span>
                </li>
              </ul>
              <button className="mt-4 text-red-600 font-semibold text-sm flex items-center gap-1 hover:underline cursor-pointer">
                Learn more <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Organ Donation */}
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
                <h3 className="text-lg sm:text-xl font-semibold">Organ Donation</h3>
              </div>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Living Donors: Age 18-65 years</span>
                </li>
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Deceased Donors: No age limit</span>
                </li>
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>No major diseases (HIV, Cancer, etc.)</span>
                </li>
                <li className="flex items-start space-x-2 text-sm sm:text-base">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Blood type compatibility required</span>
                </li>
              </ul>
              <button className="mt-4 text-red-600 font-semibold text-sm flex items-center gap-1 hover:underline cursor-pointer">
                Learn more <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Organs We Match */}
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <Stethoscope className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
                <h3 className="text-lg sm:text-xl font-semibold">Organs We Match</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Kidney</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Liver</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Heart</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Lungs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Pancreas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Cornea</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Bone Marrow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplet className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span className="text-xs sm:text-sm">Skin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes - Responsive */}
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 p-5 sm:p-6 rounded-xl">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3">💡 Important Notes</h3>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-base sm:text-lg">🩸</span>
                <span>Blood donation takes only 10-15 minutes and saves up to 3 lives!</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-base sm:text-lg">❤️</span>
                <span>One organ donor can save up to 8 lives through organ donation.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-base sm:text-lg">⚕️</span>
                <span>Medical evaluation required for organ matching - consult your doctor.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 text-base sm:text-lg">📋</span>
                <span>Register as both blood and organ donor to maximize impact!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboards Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Two Simple Dashboards</h2>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* Patients Dashboard */}
            <div className="border rounded-xl overflow-hidden shadow-lg">
              <div className="bg-red-600 text-white p-4">
                <h3 className="text-lg sm:text-xl font-semibold flex items-center">
                  <Users className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> For Patients / Seekers
                </h3>
              </div>
              <div className="p-5 sm:p-6 bg-gray-50">
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Find nearby blood donors instantly
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Find organ donors (kidney, liver, heart, etc.)
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Filter by blood components & organ type
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Track donor location in real-time
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Emergency SOS button for both
                  </li>
                </ul>
                <button 
                  onClick={handleRequestClick}
                  className="mt-4 sm:mt-6 w-full bg-red-600 text-white py-2 sm:py-3 rounded-lg hover:bg-red-700 transition cursor-pointer font-bold text-sm sm:text-base"
                >
                  Request Blood or Organ →
                </button>
              </div>
            </div>

            {/* Donors Dashboard */}
            <div className="border rounded-xl overflow-hidden shadow-lg">
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-lg sm:text-xl font-semibold flex items-center">
                  <Heart className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> For Donors / Blood Banks
                </h3>
              </div>
              <div className="p-5 sm:p-6 bg-gray-50">
                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Register as blood donor OR organ donor
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Set availability status for both
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> View nearby requests (blood & organs)
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Track donation history
                  </li>
                  <li className="flex items-center text-sm sm:text-base text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Next eligible date reminders
                  </li>
                </ul>
                <button 
                  onClick={handleRegisterClick}
                  className="mt-4 sm:mt-6 w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer font-bold text-sm sm:text-base"
                >
                  Register as Donor →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplet className="h-6 w-6 text-red-500" />
                <span className="font-bold text-base sm:text-lg">BloodLocator</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">
                Connecting blood and organ donors with those in need, saving lives one donation at a time.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Emergency Contacts</h4>
              <div className="flex items-center space-x-2 text-red-500 mb-2">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-lg sm:text-xl font-bold">104</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">Blood Helpline (24/7)</p>
              <div className="flex items-center space-x-2 text-red-500 mt-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-base sm:text-xl font-bold">1800-11-4770</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">Organ Donation Helpline</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Download App</h4>
              <button className="bg-gray-800 px-4 py-2 rounded-lg text-xs sm:text-sm mb-2 w-full hover:bg-gray-700 transition">
                📱 Android App (Coming Soon)
              </button>
              <button className="bg-gray-800 px-4 py-2 rounded-lg text-xs sm:text-sm w-full hover:bg-gray-700 transition">
                🍎 iOS App (Coming Soon)
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-xs sm:text-sm gap-3 sm:gap-0">
            <span className="text-center">
              © 2024 Smart Blood & Organ Donor Locator. All rights reserved. | For emergencies, contact local blood bank or organ transplant center first.
            </span>
            
            {/* Secret Admin Link */}
            <button 
              onClick={() => navigate('/admin/add-hospital')} 
              className="flex items-center hover:text-white transition cursor-pointer text-xs sm:text-sm"
              title="Admin Portal"
            >
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;