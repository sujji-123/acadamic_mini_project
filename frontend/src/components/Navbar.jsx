import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Droplet, User } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   setIsLoggedIn(!!token);
  // }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Droplet className="h-8 w-8 text-red-600" />
            <span className="font-bold text-xl text-gray-800">Blood<span className="text-red-600">Locator</span></span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-red-600 transition">Home</Link>
            <a href="/#how-it-works" className="text-gray-600 hover:text-red-600 transition">How it Works</a>
            <a href="/#guidelines" className="text-gray-600 hover:text-red-600 transition">Guidelines</a>
            
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-red-600 transition">Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-red-600 transition">Login</Link>
                <Link 
                  to="/register" 
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            <button className="border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition">
              Emergency Request
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <Link to="/" className="block py-2 text-gray-600 hover:text-red-600">Home</Link>
            <a href="#how-it-works" className="block py-2 text-gray-600 hover:text-red-600">How it Works</a>
            <a href="#guidelines" className="block py-2 text-gray-600 hover:text-red-600">Guidelines</a>
            
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="block py-2 text-gray-600 hover:text-red-600">Dashboard</Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-gray-600 hover:text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* <Link to="/login" className="block py-2 text-gray-600 hover:text-red-600">Login</Link> */}
                <Link 
                  to="/register" 
                  className="block w-full bg-red-600 text-white px-4 py-2 rounded-lg mt-2 text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            <button className="w-full border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg mt-2">
              Emergency Request
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;