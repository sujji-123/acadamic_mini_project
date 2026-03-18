import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

print("📊 Training Fake Detector Model...")

# Generate data
np.random.seed(42)
n_samples = 2000
n_real = int(n_samples * 0.8)
n_fake = n_samples - n_real

# Real users
real_data = {
    'email_domain_score': np.random.uniform(0.7, 1.0, n_real),
    'phone_valid': np.ones(n_real),
    'age': np.random.randint(18, 60, n_real),
    'name_length': np.random.randint(5, 30, n_real),
    'registration_hour': np.random.randint(8, 22, n_real),
    'profile_completeness': np.random.uniform(0.7, 1.0, n_real),
    'location_accuracy': np.random.uniform(0.8, 1.0, n_real),
    'social_links': np.random.randint(0, 3, n_real),
    'activity_frequency': np.random.uniform(0.3, 1.0, n_real)
}

# Fake users
fake_data = {
    'email_domain_score': np.random.uniform(0, 0.4, n_fake),
    'phone_valid': np.random.choice([0, 1], n_fake, p=[0.7, 0.3]),
    'age': np.random.choice([0, 99, 100], n_fake),
    'name_length': np.random.randint(1, 4, n_fake),
    'registration_hour': np.random.randint(0, 5, n_fake),
    'profile_completeness': np.random.uniform(0, 0.3, n_fake),
    'location_accuracy': np.random.uniform(0, 0.3, n_fake),
    'social_links': np.random.randint(0, 1, n_fake),
    'activity_frequency': np.random.uniform(0, 0.1, n_fake)
}

df_real = pd.DataFrame(real_data)
df_fake = pd.DataFrame(fake_data)
df = pd.concat([df_real, df_fake], ignore_index=True)

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)

# Train model
model = IsolationForest(contamination=0.2, random_state=42, n_estimators=100)
model.fit(X_scaled)

# Save
os.makedirs('app/models', exist_ok=True)
joblib.dump(model, 'app/models/fake_detector.pkl')
joblib.dump(scaler, 'app/models/fake_detector_scaler.pkl')
print("✅ Models saved to app/models/")