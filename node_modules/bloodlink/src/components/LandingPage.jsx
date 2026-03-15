import React from 'react';
import { 
  Droplet, 
  MapPin, 
  Heart, 
  Clock, 
  Shield, 
  Phone,
  Users,
  Award,
  AlertCircle
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Emergency Banner */}
      <section className="pt-20 bg-gradient-to-br from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Blood Donors <br />Instantly During Emergencies
              </h1>
              <p className="text-xl mb-8 text-red-100">
                Connect with nearby blood donors, track availability in real-time, 
                and save lives with our smart matching system.
              </p>
              
              {/* Emergency CTA */}
              <div className="bg-white p-6 rounded-xl shadow-xl mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Need Blood Urgently?</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Enter your location" 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-800"
                  />
                  <select className="px-4 py-3 border border-gray-300 rounded-lg text-gray-800">
                    <option>Select Blood Group</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                  <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold">
                    Find Donors
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex space-x-8">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-red-100">Active Donors</div>
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
            
            {/* Hero Image */}
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How Our Platform Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center p-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Register</h3>
              <p className="text-gray-600">
                Donors register with their blood group, location, and health details. 
                Patients can quickly request blood without registration.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Find Nearby Donors</h3>
              <p className="text-gray-600">
                Our system automatically finds eligible donors within your area 
                using smart location tracking.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-6">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Connect & Save</h3>
              <p className="text-gray-600">
                Contact the donor directly through call or message. Track their 
                location in real-time until they reach.
              </p>
            </div>
          </div>

          {/* Platform Flow Diagram (Text-based but clear) */}
          <div className="mt-16 bg-gray-50 p-8 rounded-xl">
            <h3 className="text-xl font-semibold mb-6 text-center">Simple 3-Step Process</h3>
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-green-100 p-3 rounded-full">
                  <span className="font-bold text-green-600">Patient</span>
                </div>
                <div className="ml-2">→ Requests Blood</div>
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

      {/* Donation Guidelines Section */}
      <section id="guidelines" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Blood Donation Guidelines</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Who Can Donate */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="h-8 w-8 text-green-600" />
                <h3 className="text-xl font-semibold">Who Can Donate?</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Age between 18-60 years</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Weight at least 50 kg</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Hemoglobin ≥ 12.5 g/dL</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>No major diseases (HIV, Hepatitis, etc.)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>90 days gap between donations</span>
                </li>
              </ul>
            </div>

            {/* Who Cannot Donate */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-8 w-8 text-red-600" />
                <h3 className="text-xl font-semibold">Temporary Deferral</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Cold, flu or sore throat (wait 1 week)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Dental work (wait 24 hours - 1 month)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Vaccination (wait 2-4 weeks)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Pregnancy (6 months after delivery)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-600 font-bold">✗</span>
                  <span>Antibiotics course (wait 1 week)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Quick Tips Before Donating</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🍎</span>
                <span>Eat iron-rich foods</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">💧</span>
                <span>Drink plenty of water</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">😴</span>
                <span>Get good sleep</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">🚫</span>
                <span>Avoid alcohol (24 hrs)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Dashboards Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Two Simple Dashboards</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Patient Dashboard Preview */}
            <div className="border rounded-xl overflow-hidden shadow-lg">
              <div className="bg-red-600 text-white p-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Users className="mr-2" /> For Patients / Seekers
                </h3>
              </div>
              <div className="p-6 bg-gray-50">
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Find nearby donors instantly
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Filter by blood components
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Track donor location
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Emergency SOS button
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> View blood bank stocks
                  </li>
                </ul>
                <button className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                  Access Patient Dashboard →
                </button>
              </div>
            </div>

            {/* Donor Dashboard Preview */}
            <div className="border rounded-xl overflow-hidden shadow-lg">
              <div className="bg-blue-600 text-white p-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Heart className="mr-2" /> For Donors / Blood Banks
                </h3>
              </div>
              <div className="p-6 bg-gray-50">
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Set availability status
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> View nearby requests
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Track donation history
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Next eligible date reminder
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span> Blood camp notifications
                  </li>
                </ul>
                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Access Donor Dashboard →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplet className="h-6 w-6 text-red-500" />
                <span className="font-bold text-lg">BloodLocator</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting donors with those in need, saving lives one drop at a time.
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
              <h4 className="font-semibold mb-4">Emergency</h4>
              <div className="flex items-center space-x-2 text-red-500">
                <Phone className="h-5 w-5" />
                <span className="text-xl font-bold">104</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">24/7 Blood Help Line</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Download App</h4>
              <button className="bg-gray-800 px-4 py-2 rounded-lg text-sm mb-2 w-full">
                📱 Android App (Coming Soon)
              </button>
              <button className="bg-gray-800 px-4 py-2 rounded-lg text-sm w-full">
                🍎 iOS App (Coming Soon)
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 Smart Blood Donor Locator. All rights reserved. | For emergencies, always contact local blood bank first.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;