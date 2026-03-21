//frontend/src/components/AcceptRequest.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, HeartHandshake, Loader } from 'lucide-react';

const AcceptRequest = () => {
  const { requestId, donorId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/requests/accept/${requestId}/${donorId}`);
      setResult(response.data);
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred while processing your request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        
        {!result ? (
          <>
            <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
              <HeartHandshake className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Emergency Blood Request</h2>
            <p className="text-gray-600 mb-8">
              A patient nearby is in critical need of blood. Are you ready and available to donate right now?
            </p>
            <div className="space-y-4">
              <button 
                onClick={handleAccept}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center"
              >
                {loading ? <Loader className="animate-spin mr-2" /> : null}
                {loading ? 'Processing...' : 'Yes, I am ready to donate'}
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                I cannot donate right now
              </button>
            </div>
          </>
        ) : (
          <>
            {result.success ? (
              <div>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
                <p className="text-green-600 font-medium mb-4">{result.message}</p>
                <div className="bg-gray-50 p-4 rounded-lg text-left border mb-6">
                  <p className="text-sm text-gray-500">Patient Details:</p>
                  <p className="font-semibold">{result.patientName}</p>
                  <p className="font-semibold text-red-600">{result.patientPhone}</p>
                </div>
              </div>
            ) : (
              <div>
                 {/* Already fulfilled block */}
                <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Closed</h2>
                <p className="text-gray-600 mb-6">{result.message}</p>
              </div>
            )}
            
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              Return to Home
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default AcceptRequest;