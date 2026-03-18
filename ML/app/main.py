from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import joblib
import numpy as np
import pandas as pd
from pymongo import MongoClient
import os
from datetime import datetime, timedelta
import math
import logging
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Blood Donor ML API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Pydantic Models for Request/Response
# ============================================

class DonorFeatures(BaseModel):
    days_since_last_donation: int
    age: int
    donation_frequency: int
    distance_from_hospital: float
    response_rate: float
    hemoglobin: float
    weight: float
    previous_cancellations: int

class DonorAvailabilityResponse(BaseModel):
    donor_id: str
    available: bool
    probability: float
    confidence: str

class BloodRequest(BaseModel):
    bloodGroup: str
    latitude: float
    longitude: float
    urgency: str = "normal"  # normal, urgent, emergency
    patientId: Optional[str] = None

class RankedDonor(BaseModel):
    donorId: str
    name: str
    bloodGroup: str
    distance: float
    eligibilityScore: float
    phone: str
    age: int
    weight: float
    lastDonation: Optional[str]
    availabilityProbability: Optional[float]
    rank: int

class BloodDemandForecast(BaseModel):
    bloodGroup: str
    historical_count: int
    forecast_next_7days: int
    forecast_next_30days: int
    trend: str
    confidence: float

class UserVerificationFeatures(BaseModel):
    email_domain_score: float = Field(..., ge=0, le=1)
    phone_valid: int = Field(..., ge=0, le=1)
    age: int
    name_length: int
    registration_hour: int
    profile_completeness: float = Field(..., ge=0, le=1)
    location_accuracy: float = Field(..., ge=0, le=1)
    social_links: int
    activity_frequency: float = Field(..., ge=0, le=1)

class FakeUserResponse(BaseModel):
    isFake: bool
    confidenceScore: float
    reason: str
    flags: List[str]

# ============================================
# Load ML Models
# ============================================

MODELS_PATH = 'app/models'

def load_model(model_name):
    """Safely load a model with error handling"""
    try:
        model_path = os.path.join(MODELS_PATH, model_name)
        if os.path.exists(model_path):
            return joblib.load(model_path)
        else:
            logger.warning(f"Model {model_name} not found at {model_path}")
            return None
    except Exception as e:
        logger.error(f"Error loading model {model_name}: {e}")
        return None

# Load all models
availability_model = load_model('donor_availability.pkl')
ranking_model = load_model('donor_ranking.pkl')
fake_detector = load_model('fake_detector.pkl')
fake_scaler = load_model('fake_detector_scaler.pkl')

logger.info(f"Models loaded - Availability: {availability_model is not None}, Ranking: {ranking_model is not None}, Fake Detector: {fake_detector is not None}")

# ============================================
# MongoDB Connection
# ============================================

MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://sujji_123:sujji1234@cluster0.nyqb78a.mongodb.net/bloodlink')
try:
    client = MongoClient(MONGO_URI)
    db = client['bloodlink']
    # Test connection
    client.admin.command('ping')
    logger.info("✅ Connected to MongoDB")
except Exception as e:
    logger.error(f"❌ MongoDB connection failed: {e}")
    db = None

# ============================================
# Utility Functions
# ============================================

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km using Haversine formula"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return round(R * c, 2)

def calculate_eligibility_score(donor: dict) -> float:
    """Calculate donor eligibility score based on IEEE paper criteria"""
    details = donor.get('donorDetails', {})
    score = 0
    reasons = []
    
    # Age score (max 25)
    age = details.get('age', 0)
    if 18 <= age <= 60:
        if 25 <= age <= 45:
            score += 25
            reasons.append(f"Age {age} - optimal")
        else:
            score += 20
            reasons.append(f"Age {age} - acceptable")
    else:
        reasons.append(f"Age {age} - not eligible")
        return 0  # Not eligible at all
    
    # Weight score (max 20)
    weight = details.get('weight', 0)
    if weight >= 50:
        if weight >= 70:
            score += 20
            reasons.append(f"Weight {weight}kg - excellent")
        else:
            score += 15
            reasons.append(f"Weight {weight}kg - good")
    else:
        reasons.append(f"Weight {weight}kg - below minimum")
        return 0
    
    # Hemoglobin score (max 25)
    hb = details.get('hemoglobin', 0)
    if hb >= 12.5:
        if hb >= 14:
            score += 25
            reasons.append(f"Hemoglobin {hb} - excellent")
        else:
            score += 20
            reasons.append(f"Hemoglobin {hb} - good")
    else:
        reasons.append(f"Hemoglobin {hb} - below minimum")
        return 0
    
    # Last donation score (max 30)
    last_donation = details.get('lastDonationDate')
    if last_donation:
        if isinstance(last_donation, str):
            last_donation = datetime.fromisoformat(last_donation.replace('Z', '+00:00'))
        days_since = (datetime.now() - last_donation).days
        if days_since >= 90:
            if days_since >= 180:
                score += 30
                reasons.append(f"Last donation {days_since} days ago - excellent")
            else:
                score += 20
                reasons.append(f"Last donation {days_since} days ago - good (minimum 90 days)")
        else:
            reasons.append(f"Last donation only {days_since} days ago - too soon")
            return 0
    else:
        score += 30  # Never donated
        reasons.append("Never donated - eligible")
    
    # Final score (0-100)
    final_score = min(100, score)
    
    logger.debug(f"Eligibility score for donor {donor.get('_id')}: {final_score} - {reasons}")
    return final_score

def predict_availability_ml(donor: dict) -> dict:
    """Use ML model to predict donor availability"""
    if not availability_model:
        return {"available": True, "probability": 0.8, "confidence": "medium"}
    
    try:
        details = donor.get('donorDetails', {})
        last_donation = details.get('lastDonationDate')
        
        if last_donation:
            if isinstance(last_donation, str):
                last_donation = datetime.fromisoformat(last_donation.replace('Z', '+00:00'))
            days_since = (datetime.now() - last_donation).days
        else:
            days_since = 365  # Never donated
        
        # Prepare features
        features = np.array([[
            days_since,
            details.get('age', 30),
            details.get('donationCount', 0),
            5.0,  # Default distance
            0.8,  # Default response rate
            details.get('hemoglobin', 13),
            details.get('weight', 65),
            0     # Default cancellations
        ]])
        
        # Predict
        probability = availability_model.predict_proba(features)[0][1]
        prediction = availability_model.predict(features)[0]
        
        confidence = "high" if probability > 0.8 or probability < 0.2 else "medium"
        
        return {
            "available": bool(prediction),
            "probability": float(probability),
            "confidence": confidence
        }
    except Exception as e:
        logger.error(f"ML prediction error: {e}")
        return {"available": True, "probability": 0.7, "confidence": "low"}

# ============================================
# API Endpoints
# ============================================

@app.get("/")
def root():
    """Root endpoint - API status"""
    return {
        "service": "Blood Donor ML API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "availability": availability_model is not None,
            "ranking": ranking_model is not None,
            "fake_detector": fake_detector is not None
        },
        "database": db is not None
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if db else "disconnected"
    }

# ============================================
# Endpoint 1: Find Best Donors (Haversine + Eligibility Score)
# ============================================

@app.post("/find-best-donors", response_model=Dict)
async def find_best_donors(request: BloodRequest):
    """Find and rank best donors for blood request using Haversine formula and eligibility scoring"""
    logger.info(f"Finding donors for {request.bloodGroup} at ({request.latitude}, {request.longitude})")
    
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        # Get eligible donors from MongoDB
        donors = list(db.users.find({
            "userType": {"$in": ["individual_donor", "paid_donor"]},
            "donorDetails.bloodGroup": request.bloodGroup,
            "donorDetails.isAvailable": True
        }).limit(100))
        
        logger.info(f"Found {len(donors)} potential donors")
        
        if not donors:
            return {
                "success": True,
                "donors": [],
                "message": "No donors found for this blood group"
            }
        
        ranked_donors = []
        for donor in donors:
            # Get donor coordinates
            location = donor.get('location', {})
            coordinates = location.get('coordinates', {})
            donor_lat = coordinates.get('lat', 0)
            donor_lng = coordinates.get('lng', 0)
            
            # Calculate distance using Haversine
            if donor_lat and donor_lng and request.latitude and request.longitude:
                distance = haversine(request.latitude, request.longitude, donor_lat, donor_lng)
            else:
                distance = 999.99  # Unknown location
                logger.warning(f"Donor {donor.get('_id')} has no location coordinates")
            
            # Calculate eligibility score
            eligibility_score = calculate_eligibility_score(donor)
            
            # Skip if not eligible (score = 0)
            if eligibility_score == 0:
                continue
            
            # Get ML availability prediction
            ml_prediction = predict_availability_ml(donor)
            
            # Calculate final combined score
            # 40% weight to distance, 40% to eligibility, 20% to ML prediction
            distance_score = max(0, 100 - (distance * 5))  # Closer = higher score
            final_score = (
                (distance_score * 0.4) +
                (eligibility_score * 0.4) +
                (ml_prediction['probability'] * 100 * 0.2)
            )
            
            # Format last donation date
            last_donation = donor.get('donorDetails', {}).get('lastDonationDate')
            if last_donation:
                if isinstance(last_donation, datetime):
                    last_donation = last_donation.isoformat()
            
            ranked_donors.append({
                "donorId": str(donor['_id']),
                "name": donor['name'],
                "bloodGroup": donor.get('donorDetails', {}).get('bloodGroup'),
                "distance": distance,
                "eligibilityScore": eligibility_score,
                "availabilityProbability": ml_prediction['probability'],
                "finalScore": round(final_score, 2),
                "phone": donor.get('phone'),
                "age": donor.get('donorDetails', {}).get('age'),
                "weight": donor.get('donorDetails', {}).get('weight'),
                "lastDonation": last_donation,
                "donationCount": donor.get('donorDetails', {}).get('donationCount', 0),
                "userType": donor.get('userType'),
                "expectedAmount": donor.get('donorDetails', {}).get('expectedAmount', 0) if donor.get('userType') == 'paid_donor' else 0,
                "location": {
                    "address": location.get('address'),
                    "city": location.get('city')
                }
            })
        
        # Sort by final score (higher is better) and distance
        ranked_donors.sort(key=lambda x: (-x['finalScore'], x['distance']))
        
        # Add rank
        for i, donor in enumerate(ranked_donors[:20], 1):
            donor['rank'] = i
        
        logger.info(f"Returning {len(ranked_donors[:20])} ranked donors")
        
        return {
            "success": True,
            "donors": ranked_donors[:20],
            "total": len(ranked_donors),
            "request": {
                "bloodGroup": request.bloodGroup,
                "latitude": request.latitude,
                "longitude": request.longitude,
                "urgency": request.urgency
            }
        }
        
    except Exception as e:
        logger.error(f"Error in find_best_donors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Endpoint 2: Predict Single Donor Availability
# ============================================

@app.post("/predict-availability", response_model=DonorAvailabilityResponse)
async def predict_availability(features: DonorFeatures):
    """Predict if a specific donor is available to donate"""
    try:
        X = np.array([[
            features.days_since_last_donation,
            features.age,
            features.donation_frequency,
            features.distance_from_hospital,
            features.response_rate,
            features.hemoglobin,
            features.weight,
            features.previous_cancellations
        ]])
        
        if availability_model:
            probability = availability_model.predict_proba(X)[0][1]
            prediction = availability_model.predict(X)[0]
        else:
            # Fallback logic if model not available
            probability = 0.7
            prediction = 1
            logger.warning("Using fallback availability prediction (model not loaded)")
        
        confidence = "high" if probability > 0.8 or probability < 0.2 else "medium"
        
        return {
            "donor_id": "sample",
            "available": bool(prediction),
            "probability": float(probability),
            "confidence": confidence
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Endpoint 3: Detect Fake Users
# ============================================

@app.post("/detect-fake-user", response_model=FakeUserResponse)
async def detect_fake_user(features: UserVerificationFeatures):
    """Detect if a user registration is fake or spam"""
    try:
        if not fake_detector or not fake_scaler:
            # Fallback rule-based detection
            flags = []
            is_fake = False
            
            # Rule-based checks
            if features.name_length < 3:
                flags.append("Name too short")
                is_fake = True
            
            if features.age < 15 or features.age > 100:
                flags.append("Invalid age")
                is_fake = True
            
            if features.registration_hour < 6 or features.registration_hour > 22:
                flags.append("Suspicious registration time")
            
            if features.email_domain_score < 0.3:
                flags.append("Suspicious email domain")
                is_fake = True
            
            if features.profile_completeness < 0.2:
                flags.append("Incomplete profile")
            
            confidence = 70 if is_fake else 85
            
            return {
                "isFake": is_fake,
                "confidenceScore": confidence,
                "reason": "Suspicious patterns detected" if is_fake else "User appears genuine",
                "flags": flags[:3]  # Return top 3 flags
            }
        
        # ML-based detection
        X = np.array([[
            features.email_domain_score,
            features.phone_valid,
            features.age,
            features.name_length,
            features.registration_hour,
            features.profile_completeness,
            features.location_accuracy,
            features.social_links,
            features.activity_frequency
        ]])
        
        X_scaled = fake_scaler.transform(X)
        prediction = fake_detector.predict(X_scaled)[0]
        score = fake_detector.score_samples(X_scaled)[0]
        
        # Normalize score to 0-100 (higher = more genuine)
        normalized_score = min(100, max(0, (score + 10) / 20 * 100))
        
        is_fake = prediction == -1
        
        # Get feature contributions (simple explanation)
        flags = []
        if features.email_domain_score < 0.4:
            flags.append("Suspicious email domain")
        if features.phone_valid == 0:
            flags.append("Invalid phone number")
        if features.name_length < 4:
            flags.append("Name too short")
        if features.profile_completeness < 0.3:
            flags.append("Incomplete profile")
        if features.registration_hour < 6 or features.registration_hour > 22:
            flags.append("Unusual registration time")
        
        return {
            "isFake": bool(is_fake),
            "confidenceScore": round(100 - normalized_score if is_fake else normalized_score, 2),
            "reason": "ML model detected suspicious patterns" if is_fake else "User appears genuine",
            "flags": flags[:3]
        }
        
    except Exception as e:
        logger.error(f"Fake detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Endpoint 4: Blood Demand Forecast
# ============================================

@app.get("/forecast-demand", response_model=Dict)
async def forecast_demand(days: int = 30):
    """Forecast blood demand for next N days"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Get historical requests from last 90 days
        ninety_days_ago = datetime.now() - timedelta(days=90)
        
        # Try to get from requests collection if exists
        try:
            requests = list(db.requests.find({
                "createdAt": {"$gte": ninety_days_ago}
            }))
        except:
            # If collection doesn't exist, use sample data
            logger.warning("Requests collection not found, using sample data")
            requests = generate_sample_requests()
        
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
        forecast = []
        
        for bg in blood_groups:
            # Count historical requests
            if requests:
                bg_requests = [r for r in requests if r.get('bloodGroup') == bg]
                historical_count = len(bg_requests)
                
                # Calculate daily average
                daily_avg = historical_count / 90 if historical_count > 0 else 0
                
                # Simple forecast (linear)
                forecast_7days = int(daily_avg * 7)
                forecast_30days = int(daily_avg * 30)
                
                # Determine trend
                if historical_count > 50:
                    trend = "high"
                elif historical_count > 20:
                    trend = "medium"
                else:
                    trend = "low"
                
                # Confidence based on data volume
                confidence = min(95, 50 + historical_count) if historical_count > 0 else 30
            else:
                # Sample data if no real requests
                historical_count = np.random.randint(10, 100)
                daily_avg = historical_count / 90
                forecast_7days = int(daily_avg * 7 * np.random.uniform(0.8, 1.2))
                forecast_30days = int(daily_avg * 30 * np.random.uniform(0.8, 1.2))
                trend = np.random.choice(["low", "medium", "high"])
                confidence = np.random.randint(60, 90)
            
            forecast.append({
                "bloodGroup": bg,
                "historical_count": historical_count,
                "forecast_next_7days": max(0, forecast_7days),
                "forecast_next_30days": max(0, forecast_30days),
                "trend": trend,
                "confidence": confidence
            })
        
        # Sort by demand
        forecast.sort(key=lambda x: x['forecast_next_30days'], reverse=True)
        
        return {
            "success": True,
            "forecast": forecast,
            "generated_at": datetime.now().isoformat(),
            "period_days": days,
            "total_historical": sum(f['historical_count'] for f in forecast)
        }
        
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_sample_requests():
    """Generate sample request data for testing"""
    import random
    blood_groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    requests = []
    
    for i in range(200):
        requests.append({
            "bloodGroup": random.choice(blood_groups),
            "createdAt": datetime.now() - timedelta(days=random.randint(0, 90))
        })
    
    return requests

# ============================================
# Endpoint 5: Donor Ranking (ML-based)
# ============================================

@app.post("/rank-donors-ml")
async def rank_donors_ml(request: BloodRequest):
    """Rank donors using ML model (if available)"""
    if not ranking_model:
        # Fallback to rule-based ranking
        return await find_best_donors(request)
    
    try:
        # Get donors
        donors = list(db.users.find({
            "userType": {"$in": ["individual_donor", "paid_donor"]},
            "donorDetails.bloodGroup": request.bloodGroup,
            "donorDetails.isAvailable": True
        }).limit(50))
        
        if not donors:
            return {"donors": []}
        
        ranked_donors = []
        for donor in donors:
            # Get location
            location = donor.get('location', {})
            coordinates = location.get('coordinates', {})
            donor_lat = coordinates.get('lat', 0)
            donor_lng = coordinates.get('lng', 0)
            
            # Calculate distance
            if donor_lat and donor_lng:
                distance = haversine(request.latitude, request.longitude, donor_lat, donor_lng)
            else:
                distance = 999
            
            # Prepare features for ML ranking
            details = donor.get('donorDetails', {})
            last_donation = details.get('lastDonationDate')
            if last_donation:
                if isinstance(last_donation, str):
                    last_donation = datetime.fromisoformat(last_donation.replace('Z', '+00:00'))
                days_since = (datetime.now() - last_donation).days
            else:
                days_since = 365
            
            features = np.array([[
                distance,
                calculate_eligibility_score(donor),
                details.get('donationCount', 0),
                24,  # Default response speed
                0.8,  # Default success rate
                details.get('age', 30),
                details.get('hemoglobin', 13),
                details.get('weight', 65),
                days_since
            ]])
            
            # Predict rank score
            rank_score = ranking_model.predict(features)[0]
            
            ranked_donors.append({
                "donorId": str(donor['_id']),
                "name": donor['name'],
                "bloodGroup": details.get('bloodGroup'),
                "distance": distance,
                "rankScore": float(rank_score),
                "phone": donor['phone']
            })
        
        # Sort by rank score
        ranked_donors.sort(key=lambda x: x['rankScore'], reverse=True)
        
        return {
            "success": True,
            "method": "ml",
            "donors": ranked_donors[:15]
        }
        
    except Exception as e:
        logger.error(f"ML ranking error: {e}")
        # Fallback to regular ranking
        return await find_best_donors(request)

# ============================================
# Endpoint 6: Batch Eligibility Check
# ============================================

@app.post("/batch-eligibility")
async def batch_eligibility(donor_ids: List[str]):
    """Check eligibility for multiple donors at once"""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        results = []
        object_ids = [ObjectId(id) for id in donor_ids if ObjectId.is_valid(id)]
        
        donors = list(db.users.find({"_id": {"$in": object_ids}}))
        
        for donor in donors:
            score = calculate_eligibility_score(donor)
            ml_pred = predict_availability_ml(donor)
            
            results.append({
                "donorId": str(donor['_id']),
                "name": donor['name'],
                "eligibilityScore": score,
                "isEligible": score > 60,
                "availabilityPrediction": ml_pred,
                "bloodGroup": donor.get('donorDetails', {}).get('bloodGroup')
            })
        
        return {
            "success": True,
            "results": results,
            "total": len(results)
        }
        
    except Exception as e:
        logger.error(f"Batch eligibility error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# Endpoint 7: Get Model Info
# ============================================

@app.get("/model-info")
async def get_model_info():
    """Get information about loaded ML models"""
    model_info = {}
    
    if availability_model:
        model_info['availability'] = {
            "type": type(availability_model).__name__,
            "features": ["days_since_last_donation", "age", "donation_frequency", 
                        "distance", "response_rate", "hemoglobin", "weight", "cancellations"],
            "loaded": True
        }
    
    if ranking_model:
        model_info['ranking'] = {
            "type": type(ranking_model).__name__,
            "features": ["distance", "health_score", "donation_count", 
                        "response_speed", "success_rate", "age", "hemoglobin", "weight", "days_since"],
            "loaded": True
        }
    
    if fake_detector:
        model_info['fake_detector'] = {
            "type": type(fake_detector).__name__,
            "features": ["email_score", "phone_valid", "age", "name_length", 
                        "reg_hour", "profile_complete", "location_acc", "social_links", "activity"],
            "loaded": True
        }
    
    return {
        "success": True,
        "models": model_info,
        "timestamp": datetime.now().isoformat()
    }

# ============================================
# Run with: uvicorn app.main:app --reload --port 8000
# ============================================