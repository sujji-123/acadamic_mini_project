import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AcceptRequest from './components/AcceptRequest'; // NEW LINE

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
          <Route path="/accept-request/:requestId/:donorId" element={<AcceptRequest />} /> {/* NEW LINE */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;