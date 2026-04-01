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
import re
import random

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
    social_links: int = Field(default=0)
    activity_frequency: float = Field(default=0.5, ge=0, le=1)

class FakeUserResponse(BaseModel):
    isFake: bool
    confidenceScore: float
    reason: str
    flags: List[str]

class LiveLocationUpdate(BaseModel):
    userId: str
    latitude: float
    longitude: float
    timestamp: Optional[str] = None

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

def calculate_email_domain_score(email: str) -> float:
    """Calculate email domain trust score"""
    suspicious_domains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'yopmail.com']
    domain = email.split('@')[-1].lower()
    
    if domain in suspicious_domains:
        return 0.1
    elif domain.endswith('.edu'):
        return 1.0
    elif domain.endswith('.gov'):
        return 1.0
    elif domain in ['gmail.com', 'yahoo.com', 'outlook.com']:
        return 0.8
    else:
        return 0.5

def validate_phone(phone: str) -> int:
    """Validate phone number format"""
    phone_pattern = re.compile(r'^[6-9]\d{9}$')
    return 1 if phone_pattern.match(phone) else 0

def calculate_profile_completeness(user_data: dict) -> float:
    """Calculate profile completeness score"""
    required_fields = ['name', 'email', 'phone', 'userType']
    filled = sum(1 for field in required_fields if user_data.get(field))
    
    if user_data.get('userType') in ['individual_donor', 'paid_donor']:
        donor_fields = ['donorDetails.age', 'donorDetails.weight', 'donorDetails.bloodGroup']
        for field in donor_fields:
            parts = field.split('.')
            val = user_data
            for part in parts:
                val = val.get(part, {}) if isinstance(val, dict) else None
            if val:
                filled += 1
        total = len(required_fields) + len(donor_fields)
    elif user_data.get('userType') == 'blood_bank':
        bank_fields = ['bloodBankDetails.registrationNumber', 'bloodBankDetails.establishedYear']
        for field in bank_fields:
            parts = field.split('.')
            val = user_data
            for part in parts:
                val = val.get(part, {}) if isinstance(val, dict) else None
            if val:
                filled += 1
        total = len(required_fields) + len(bank_fields)
    elif user_data.get('userType') == 'patient':
        patient_fields = ['patientDetails.bloodGroup']
        for field in patient_fields:
            parts = field.split('.')
            val = user_data
            for part in parts:
                val = val.get(part, {}) if isinstance(val, dict) else None
            if val:
                filled += 1
        total = len(required_fields) + len(patient_fields)
    else:
        total = len(required_fields)
    
    return filled / total if total > 0 else 0

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
    
    if db is None:
        return {"success": False, "message": "Database connection failed"}
    
    try:
        # Get eligible donors from MongoDB
        donors = list(db.users.find({
            "userType": {"$in": ["individual_donor", "paid_donor"]},
            "donorDetails.bloodGroup": request.bloodGroup,
            "donorDetails.isAvailable": True,
            "isSpam": {"$ne": True}  # Exclude spam users
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
# Endpoint 3: Detect Fake Users (Enhanced)
# ============================================

@app.post("/detect-fake-user", response_model=FakeUserResponse)
async def detect_fake_user(features: UserVerificationFeatures):
    """Detect if a user registration is fake or spam with enhanced detection"""
    try:
        flags = []
        is_fake = False
        confidence = 85
        reason = "User appears genuine"
        
        # Enhanced rule-based detection
        # 1. Name validation
        if features.name_length < 3:
            flags.append("Name too short (min 3 characters)")
            is_fake = True
        elif features.name_length > 50:
            flags.append("Name too long (max 50 characters)")
            is_fake = True
        
        # 2. Age validation
        if features.age < 18:
            flags.append(f"Age {features.age} - below minimum (18 required)")
            is_fake = True
        elif features.age > 100:
            flags.append("Invalid age")
            is_fake = True
        
        # 3. Registration time analysis (suspicious hours: 12 AM - 5 AM)
        if features.registration_hour < 5 or features.registration_hour > 23:
            flags.append("Unusual registration time (off-peak hours)")
            # Don't mark as fake, just flag for review
        
        # 4. Email domain analysis
        if features.email_domain_score < 0.3:
            flags.append("Suspicious email domain (temporary email detected)")
            is_fake = True
            confidence -= 20
        elif features.email_domain_score < 0.6:
            flags.append("Uncommon email domain")
        
        # 5. Phone validation
        if features.phone_valid == 0:
            flags.append("Invalid phone number format")
            is_fake = True
            confidence -= 25
        
        # 6. Profile completeness
        if features.profile_completeness < 0.3:
            flags.append("Profile incomplete (below 30%)")
            is_fake = True
        elif features.profile_completeness < 0.5:
            flags.append("Profile partially complete")
        
        # 7. Location accuracy
        if features.location_accuracy < 0.3:
            flags.append("Suspicious location data")
            is_fake = True
        
        # 8. Activity frequency check
        if features.activity_frequency < 0.1:
            flags.append("Unusual activity pattern")
        
        # 9. Social links check
        if features.social_links == 0 and features.profile_completeness > 0.7:
            flags.append("No social links for high completeness profile")
        
        # Try ML-based detection if models are available
        if fake_detector and fake_scaler:
            try:
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
                
                ml_fake = prediction == -1
                
                # Combine rule-based and ML results
                if ml_fake:
                    is_fake = True
                    confidence = round(100 - normalized_score, 2)
                    reason = "ML model detected suspicious patterns"
                else:
                    # Only override if confidence is higher
                    if confidence > normalized_score:
                        confidence = round(normalized_score, 2)
                        reason = "ML model confirms genuine user"
            except Exception as ml_error:
                logger.error(f"ML prediction error: {ml_error}")
                # Continue with rule-based result
        
        # Calculate final confidence based on number of flags
        if len(flags) >= 3:
            confidence = min(confidence, 40)
            if not is_fake:
                is_fake = True
                reason = "Multiple suspicious patterns detected"
        elif len(flags) == 2:
            confidence = min(confidence, 60)
        elif len(flags) == 1:
            confidence = min(confidence, 75)
        
        # Ensure confidence is within 0-100
        confidence = max(0, min(100, confidence))
        
        return {
            "isFake": is_fake,
            "confidenceScore": confidence,
            "reason": reason if not flags else f"{reason} - {', '.join(flags[:3])}",
            "flags": flags[:5]  # Return top 5 flags
        }
        
    except Exception as e:
        logger.error(f"Fake detection error: {e}")
        # Return safe fallback with basic checks
        return {
            "isFake": False,
            "confidenceScore": 50,
            "reason": "Verification system temporarily using basic checks",
            "flags": ["System in fallback mode"]
        }

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
            "donorDetails.isAvailable": True,
            "isSpam": {"$ne": True}
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


#  Batch Eligibility Check


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
# Endpoint 8: Enhanced Fake User Detection with Complete Data
# ============================================

@app.post("/verify-user-registration")
async def verify_user_registration(user_data: dict):
    """Complete user verification endpoint that accepts full user data"""
    try:
        # Extract features from user data
        email = user_data.get('email', '')
        phone = user_data.get('phone', '')
        name = user_data.get('name', '')
        age = user_data.get('donorDetails', {}).get('age', user_data.get('patientDetails', {}).get('age', 25))
        
        # Calculate features
        email_score = calculate_email_domain_score(email)
        phone_valid = validate_phone(phone)
        name_length = len(name)
        registration_hour = datetime.now().hour
        profile_completeness = calculate_profile_completeness(user_data)
        location_accuracy = 0.7  # Default, can be enhanced with actual location validation
        
        # Create features object
        features = UserVerificationFeatures(
            email_domain_score=email_score,
            phone_valid=phone_valid,
            age=age,
            name_length=name_length,
            registration_hour=registration_hour,
            profile_completeness=profile_completeness,
            location_accuracy=location_accuracy,
            social_links=1 if user_data.get('socialLinks') else 0,
            activity_frequency=0.5
        )
        
        # Call the detection endpoint
        result = await detect_fake_user(features)
        
        return {
            "success": True,
            "verification": result.dict(),
            "features_analyzed": {
                "email_score": email_score,
                "phone_valid": phone_valid,
                "profile_completeness": profile_completeness
            }
        }
        
    except Exception as e:
        logger.error(f"User verification error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# ============================================
# Endpoint 9: Live Location Updates
# ============================================

@app.post("/update-location")
async def update_live_location(location: LiveLocationUpdate):
    """Update and store live location for user tracking"""
    try:
        if not db:
            return {"success": False, "message": "Database connection failed"}
        
        # Update user's current location
        db.users.update_one(
            {"_id": ObjectId(location.userId)},
            {
                "$set": {
                    "currentLocation": {
                        "lat": location.latitude,
                        "lng": location.longitude,
                        "timestamp": location.timestamp or datetime.now().isoformat()
                    }
                }
            }
        )
        
        # Also store in location history
        db.location_history.insert_one({
            "userId": location.userId,
            "lat": location.latitude,
            "lng": location.longitude,
            "timestamp": datetime.now()
        })
        
        return {"success": True, "message": "Location updated"}
        
    except Exception as e:
        logger.error(f"Location update error: {e}")
        return {"success": False, "error": str(e)}

# ============================================
# Endpoint 10: Get Live Location for Tracking
# ============================================

@app.get("/get-location/{user_id}")
async def get_user_location(user_id: str):
    """Get current location of a user for tracking"""
    try:
        if not db:
            return {"success": False, "message": "Database connection failed"}
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"success": False, "message": "User not found"}
        
        current_location = user.get('currentLocation', {})
        if not current_location:
            return {"success": False, "message": "Location not available"}
        
        return {
            "success": True,
            "location": current_location,
            "userId": user_id,
            "name": user.get('name')
        }
        
    except Exception as e:
        logger.error(f"Get location error: {e}")
        return {"success": False, "error": str(e)}

# ============================================
# Endpoint 11: Get Active Tracking Connections
# ============================================

@app.get("/active-trackings/{user_id}")
async def get_active_trackings(user_id: str):
    """Get all active tracking connections for a user"""
    try:
        if not db:
            return {"success": False, "message": "Database connection failed"}
        
        # Find accepted requests where user is either patient or donor
        accepted_requests = list(db.requests.find({
            "$or": [
                {"patientId": user_id, "status": "accepted"},
                {"acceptedDonorId": user_id, "status": "accepted"}
            ]
        }))
        
        trackings = []
        for req in accepted_requests:
            if req.get('patientId') == user_id:
                # User is patient, track donor
                donor = db.users.find_one({"_id": ObjectId(req.get('acceptedDonorId'))})
                if donor:
                    trackings.append({
                        "type": "donor",
                        "userId": str(donor['_id']),
                        "name": donor.get('name'),
                        "location": donor.get('currentLocation', {}),
                        "requestId": str(req['_id'])
                    })
            else:
                # User is donor, track patient
                patient = db.users.find_one({"_id": ObjectId(req.get('patientId'))})
                if patient:
                    trackings.append({
                        "type": "patient",
                        "userId": str(patient['_id']),
                        "name": patient.get('name'),
                        "location": patient.get('currentLocation', {}),
                        "requestId": str(req['_id'])
                    })
        
        return {
            "success": True,
            "trackings": trackings
        }
        
    except Exception as e:
        logger.error(f"Get trackings error: {e}")
        return {"success": False, "error": str(e)}

# ============================================
# Run with: uvicorn app.main:app --reload --port 8000
# ============================================