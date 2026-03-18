import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

print("📊 Training Ranking Model...")

# Generate data
np.random.seed(42)
n_samples = 5000

data = {
    'distance_km': np.random.uniform(0, 20, n_samples),
    'health_score': np.random.uniform(0, 100, n_samples),
    'donation_count': np.random.randint(0, 20, n_samples),
    'response_speed_hours': np.random.uniform(0, 48, n_samples),
    'success_rate': np.random.uniform(0, 1, n_samples),
    'age': np.random.randint(18, 60, n_samples),
    'hemoglobin': np.random.uniform(11, 16, n_samples),
    'weight': np.random.uniform(45, 100, n_samples),
    'last_donation_days': np.random.randint(30, 365, n_samples)
}

df = pd.DataFrame(data)

# Calculate target score
df['ranking_score'] = (
    (1 / (df['distance_km'] + 1)) * 30 +
    (df['health_score'] / 100) * 25 +
    (df['success_rate']) * 20 +
    (1 / (df['response_speed_hours'] + 1)) * 15 +
    (df['donation_count'] / 20) * 10
) * 100
df['ranking_score'] = np.minimum(df['ranking_score'], 100)

# Train model
X = df.drop('ranking_score', axis=1)
y = df['ranking_score']

model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
model.fit(X, y)

# Save
os.makedirs('app/models', exist_ok=True)
joblib.dump(model, 'app/models/donor_ranking.pkl')
print(f"✅ Model saved with R² score: {model.score(X, y):.3f}")