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
  const [activeTab, setActiveTab] = React.useState('blood'); // 'blood' or 'organs'
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
    <div className="min-h-screen bg-gray-50">
      <section className="pt-20 bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Blood Donors & <br />Organ Matches Instantly
              </h1>
              <p className="text-xl mb-8 text-red-100">
                Connect with blood donors and organ donors in real-time. 
                Save lives with our smart matching system for blood transfusion and organ transplantation.
              </p>
              
             
              <div className="bg-white p-6 rounded-xl shadow-xl mb-8">
                
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('blood')}
                    className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all ${
                      activeTab === 'blood'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Droplet className="h-5 w-5" />
                    Need Blood
                  </button>
                  <button
                    onClick={() => setActiveTab('organs')}
                    className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all ${
                      activeTab === 'organs'
                        ? 'border-b-2 border-red-600 text-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Heart className="h-5 w-5" />
                    Need Organ
                  </button>
                </div>

                
                {activeTab === 'blood' && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <h2 className="text-xl font-semibold text-gray-800">Need Blood Urgently?</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        placeholder="Enter your location" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800"
                      />
                      <select 
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg text-gray-800"
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
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold disabled:bg-red-400"
                      >
                        {searchLoading ? 'Searching...' : 'Find Donors'}
                      </button>
                    </div>
                  </div>
                )}

                
                {activeTab === 'organs' && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Heart className="h-6 w-6 text-red-600" />
                      <h2 className="text-xl font-semibold text-gray-800">Need Organ Donation?</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        placeholder="Enter your location" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800"
                      />
                      <select 
                        value={organType}
                        onChange={(e) => setOrganType(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-lg text-gray-800"
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
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold disabled:bg-red-400"
                      >
                        {searchLoading ? 'Searching...' : 'Find Organ Donors'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      ⚠️ Organ matching requires medical evaluation and compatibility testing
                    </p>
                  </div>
                )}
              </div>
              
              
              <div className="flex space-x-8">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-red-100">Blood Donors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-red-100">Organ Donors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">150+</div>
                  <div className="text-red-100">Lives Saved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-red-100">Emergency Support</div>
                </div>
              </div>
            </div>
            
            
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Blood Donation"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How Our Platform Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="text-center p-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Register</h3>
              <p className="text-gray-600">
                Donors register with their blood group, organ donation preferences, location, and health details.
              </p>
            </div>

            
            <div className="text-center p-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Find Matches</h3>
              <p className="text-gray-600">
                Our system finds eligible blood donors OR organ donors within your area using smart matching algorithms.
              </p>
            </div>

        
            <div className="text-center p-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Connect & Save</h3>
              <p className="text-gray-600">
                Contact the donor directly. Track their location in real-time until they reach for blood or organ donation.
              </p>
            </div>
          </div>

         
          <div className="mt-16 bg-gray-50 p-8 rounded-xl">
            <h3 className="text-xl font-semibold mb-6 text-center">Simple Process</h3>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-green-100 p-3 rounded-full">
                  <span className="font-bold text-green-600">Patient</span>
                </div>
                <div className="ml-2">→ Requests Blood/Organ</div>
              </div>
              <Droplet className="text-red-600 mx-4 h-6 w-6" />
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-blue-100 p-3 rounded-full">
                  <span className="font-bold text-blue-600">System</span>
                </div>
                <div className="ml-2">→ Finds Matches</div>
              </div>
              <Droplet className="text-red-600 mx-4 h-6 w-6" />
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <span className="font-bold text-purple-600">Donor</span>
                </div>
                <div className="ml-2">→ Accepts & Helps</div>
              </div>
            </div>
          </div>
        </div>
      </section>

     
      <section id="guidelines" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Donation Guidelines</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
           
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Droplet className="h-8 w-8 text-red-600" />
                <h3 className="text-xl font-semibold">Blood Donation</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Age: 18-60 years</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Weight: ≥ 50 kg</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Hemoglobin: ≥ 12.5 g/dL</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>90 days gap between donations</span>
                </li>
              </ul>
              <button className="mt-4 text-red-600 font-semibold text-sm flex items-center gap-1">
                Learn more <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-8 w-8 text-red-600" />
                <h3 className="text-xl font-semibold">Organ Donation</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Living Donors: Age 18-65 years</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Deceased Donors: No age limit</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>No major diseases (HIV, Cancer, etc.)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Blood type compatibility required</span>
                </li>
              </ul>
              <button className="mt-4 text-red-600 font-semibold text-sm flex items-center gap-1">
                Learn more <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Stethoscope className="h-8 w-8 text-red-600" />
                <h3 className="text-xl font-semibold">Organs We Match</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Kidney</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Liver</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Heart</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Lungs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Pancreas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Cornea</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Bone Marrow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplet className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Skin</span>
                </div>
              </div>
            </div>
          </div>

          
          <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Important Notes</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">🩸</span>
                <span>Blood donation takes only 10-15 minutes and saves up to 3 lives!</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">❤️</span>
                <span>One organ donor can save up to 8 lives through organ donation.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">⚕️</span>
                <span>Medical evaluation required for organ matching - consult your doctor.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600">📋</span>
                <span>Register as both blood and organ donor to maximize impact!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Two Simple Dashboards</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            
            <div className="border rounded-xl overflow-hidden shadow-lg">
              <div className="bg-red-600 text-white p-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Users className="mr-2" /> For Patients / Seekers
                </h3>
              </div>
              <div className="p-6 bg-gray-50">
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Find nearby blood donors instantly
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Find organ donors (kidney, liver, heart, etc.)
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Filter by blood components & organ type
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Track donor location in real-time
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Emergency SOS button for both
                  </li>
                </ul>
                <button 
                  onClick={handleRequestClick}
                  className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Request Blood or Organ →
                </button>
              </div>
            </div>

            
            <div className="border rounded-xl overflow-hidden shadow-lg">
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Heart className="mr-2" /> For Donors / Blood Banks
                </h3>
              </div>
              <div className="p-6 bg-gray-50">
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Register as blood donor OR organ donor
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Set availability status for both
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> View nearby requests (blood & organs)
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Track donation history
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Next eligible date reminders
                  </li>
                </ul>
                <button 
                  onClick={handleRegisterClick}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Register as Donor →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

     
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplet className="h-6 w-6 text-red-500" />
                <span className="font-bold text-lg">BloodLocator</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting blood and organ donors with those in need, saving lives one donation at a time.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">FAQs</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Emergency Contacts</h4>
              <div className="flex items-center space-x-2 text-red-500 mb-2">
                <Phone className="h-5 w-5" />
                <span className="text-xl font-bold">104</span>
              </div>
              <p className="text-gray-400 text-sm">Blood Helpline (24/7)</p>
              <div className="flex items-center space-x-2 text-red-500 mt-3">
                <Phone className="h-5 w-5" />
                <span className="text-xl font-bold">1800-11-4770</span>
              </div>
              <p className="text-gray-400 text-sm">Organ Donation Helpline</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Download App</h4>
              <button className="bg-gray-800 px-4 py-2 rounded-lg text-sm mb-2 w-full">
                📱 Android App (Coming Soon)
              </button>
              <button className="bg-gray-800 px-4 py-2 rounded-lg text-sm w-full">
                🍎 iOS App (Coming Soon)
              </button>
              <p className="text-gray-500 text-xs mt-3 text-center">
                Join us in saving lives!
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 Smart Blood & Organ Donor Locator. All rights reserved. | For emergencies, contact local blood bank or organ transplant center first.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;