import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AcceptRequest from './components/AcceptRequest';
import FindDonors from './components/FindDonors';
import FindOrgans from './components/FindOrgans';
import AdminAddHospital from './components/AdminAddHospital'; // <-- NEW IMPORT

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accept-request/:requestId/:donorId" element={<AcceptRequest />} />
          <Route path="/find-donors" element={<FindDonors />} /> 
          <Route path="/find-organs" element={<FindOrgans />} /> 
          
          {/* THE SECRET ADMIN ROUTE */}
          <Route path="/admin/add-hospital" element={<AdminAddHospital />} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App;