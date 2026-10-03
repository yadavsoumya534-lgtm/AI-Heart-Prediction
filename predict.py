import joblib
import pandas as pd

# ===========================
# Load Saved Model Pipeline
# ===========================
# heart_model.pkl stores a dict — {"model", "scaler", "imputer", "features"} —
# not a bare estimator. Loading it and calling .predict() directly (as this
# script used to) fails immediately since a dict has no .predict() method.
pipeline = joblib.load("heart_model.pkl")
model = pipeline["model"]
scaler = pipeline["scaler"]
imputer = pipeline["imputer"]
FEATURES = pipeline["features"]

# ===========================
# Enter Patient Details
# ===========================
patient_data = {
    "age": 52,
    "sex": 1,
    "cp": 0,
    "trestbps": 125,
    "chol": 212,
    "fbs": 0,
    "restecg": 1,
    "thalach": 168,
    "exang": 0,
    "oldpeak": 1.0,
    "slope": 2,
    "ca": 0,
    "thal": 2
}

# ===========================
# Feature Engineering
# ===========================
# Must exactly match train_model.py's feature engineering — the model was
# trained on these three extra derived columns, not just the 13 raw ones.
def age_group(age):
    if age <= 40:
        return 0
    elif age <= 55:
        return 1
    elif age <= 70:
        return 2
    else:
        return 3

patient_data["age_thalach_ratio"] = patient_data["age"] / (patient_data["thalach"] + 1)
patient_data["bp_chol_product"] = (patient_data["trestbps"] * patient_data["chol"]) / 10000
patient_data["age_group"] = age_group(patient_data["age"])

# Convert to DataFrame in the exact column order the pipeline expects
input_data = pd.DataFrame([patient_data])[FEATURES]

# ===========================
# Predict
# ===========================
imputed = imputer.transform(input_data)
scaled = scaler.transform(imputed)

prediction = model.predict(scaled)[0]
probability = model.predict_proba(scaled)[0]

# ===========================
# Display Result
# ===========================
print("=" * 40)
print("Heart Disease Prediction")
print("=" * 40)

if prediction == 1:
    print("Prediction : HIGH RISK")
    print(f"Confidence: {probability[1] * 100:.2f}%")
else:
    print("Prediction : LOW RISK")
    print(f"Confidence: {probability[0] * 100:.2f}%")

print("=" * 40)
