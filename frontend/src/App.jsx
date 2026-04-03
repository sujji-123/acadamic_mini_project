import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AcceptRequest from './components/AcceptRequest';
import FindDonors from './components/FindDonors'; // <--- 1. ADD THIS IMPORT

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
          
          {/* 2. ADD THIS NEW ROUTE */}
          <Route path="/find-donors" element={<FindDonors />} /> 
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;