import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Droplet, User, Globe } from 'lucide-react';
import GoogleTranslate from './GoogleTranslate'; 

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleEmergencyClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    } else {
      alert('Please log in to initiate an Emergency Request.');
      navigate('/login?redirect=/dashboard');
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <Droplet className="h-8 w-8 text-red-600" />
            <span className="font-bold text-xl text-gray-800">DONOR<span className="text-red-600">NET</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-red-600 transition whitespace-nowrap">Home</Link>
            <a href="/#how-it-works" className="text-gray-600 hover:text-red-600 transition whitespace-nowrap">How it Works</a>
            <a href="/#guidelines" className="text-gray-600 hover:text-red-600 transition whitespace-nowrap">Guidelines</a>
            
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition whitespace-nowrap">Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition cursor-pointer whitespace-nowrap"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-red-600 transition whitespace-nowrap">Login</Link>
                <Link 
                  to="/register" 
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Desktop Language Selector - Properly Aligned */}
            <div className="relative flex items-center">
              <div className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <div className="language-selector-wrapper">
                  <GoogleTranslate />
                </div>
              </div>
            </div>

            <button 
              onClick={handleEmergencyClick}
              className="border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition cursor-pointer whitespace-nowrap"
            >
              Emergency Request
            </button>
          </div>

          {/* Mobile menu button & Translator */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile translator icon - more compact */}
            <div className="relative">
              <div className="flex items-center px-2 py-1 rounded-md bg-gray-50 border border-gray-200">
                <Globe className="h-3.5 w-3.5 text-gray-500 flex-shrink-0 mr-1" />
                <div className="mobile-language-selector">
                  <GoogleTranslate />
                </div>
              </div>
            </div>
            
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 cursor-pointer p-1">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Open State */}
        {isOpen && (
          <div className="md:hidden pb-4 pt-2">
            <Link to="/" className="block py-2 text-gray-600 hover:text-red-600" onClick={() => setIsOpen(false)}>Home</Link>
            <a href="#how-it-works" className="block py-2 text-gray-600 hover:text-red-600" onClick={() => setIsOpen(false)}>How it Works</a>
            <a href="#guidelines" className="block py-2 text-gray-600 hover:text-red-600" onClick={() => setIsOpen(false)}>Guidelines</a>
            
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="block py-2 text-gray-600 hover:text-red-600" onClick={() => setIsOpen(false)}>Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-gray-600 hover:text-red-600 cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-600 hover:text-red-600" onClick={() => setIsOpen(false)}>Login</Link>
                <Link 
                  to="/register" 
                  className="block w-full bg-red-600 text-white px-4 py-2 rounded-lg mt-2 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
            
            <button 
              onClick={handleEmergencyClick}
              className="w-full border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg mt-3 cursor-pointer hover:bg-red-50 transition"
            >
              Emergency Request
            </button>

            {/* Mobile menu language selector - cleaner layout */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Select Language:</span>
                </div>
                <div className="mobile-menu-language-selector">
                  <GoogleTranslate />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;