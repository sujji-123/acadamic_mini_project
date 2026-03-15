import React from 'react';
import { Menu, X, Droplet } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Droplet className="h-8 w-8 text-red-600" />
            <span className="font-bold text-xl text-gray-800">Blood<span className="text-red-600">Locator</span></span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-600 hover:text-red-600 transition">Home</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-red-600 transition">How it Works</a>
            <a href="#guidelines" className="text-gray-600 hover:text-red-600 transition">Guidelines</a>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
              Emergency Request
            </button>
            <button className="border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition">
              Login
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
            <a href="#home" className="block py-2 text-gray-600 hover:text-red-600">Home</a>
            <a href="#how-it-works" className="block py-2 text-gray-600 hover:text-red-600">How it Works</a>
            <a href="#guidelines" className="block py-2 text-gray-600 hover:text-red-600">Guidelines</a>
            <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg mt-2">
              Emergency Request
            </button>
            <button className="w-full border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg mt-2">
              Login
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;