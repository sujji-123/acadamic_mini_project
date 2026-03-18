import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

print("📊 Training Availability Model...")

# Generate synthetic training data
np.random.seed(42)
n_samples = 2000

data = {
    'days_since_last_donation': np.random.randint(30, 365, n_samples),
    'age': np.random.randint(18, 60, n_samples),
    'donation_frequency': np.random.randint(0, 20, n_samples),
    'distance_from_hospital': np.random.uniform(0, 20, n_samples),
    'response_rate': np.random.uniform(0, 1, n_samples),
    'hemoglobin': np.random.uniform(11, 16, n_samples),
    'weight': np.random.uniform(45, 100, n_samples),
    'previous_cancellations': np.random.randint(0, 5, n_samples)
}

df = pd.DataFrame(data)

# Generate target (available = 1, not available = 0)
conditions = (
    (df['days_since_last_donation'] > 90) & 
    (df['response_rate'] > 0.5) & 
    (df['distance_from_hospital'] < 15) &
    (df['hemoglobin'] > 12.5) &
    (df['weight'] > 50) &
    (df['previous_cancellations'] < 2)
)
df['available'] = conditions.astype(int) * np.random.choice([0, 1], n_samples, p=[0.1, 0.9])

# Train model
X = df.drop('available', axis=1)
y = df['available']

model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X, y)

# Save model
os.makedirs('app/models', exist_ok=True)
joblib.dump(model, 'app/models/donor_availability.pkl')
print("✅ Model saved to app/models/donor_availability.pkl")
print(f"   Accuracy: {model.score(X, y):.2f}")