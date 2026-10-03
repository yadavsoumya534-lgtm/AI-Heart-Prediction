import os
import joblib
import numpy as np
from datetime import datetime
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from database import users_collection, predictions_collection #[cite: 11]

app = FastAPI(title="HealthPredict AI Backend")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 🤖 MACHINE LEARNING MODEL LOAD ---
MODEL_PATH = "heart_model.pkl"
svc_model = None
scaler = None
imputer = None

if os.path.exists(MODEL_PATH):
    try:
        loaded_data = joblib.load(MODEL_PATH)
        svc_model = loaded_data["model"]
        scaler = loaded_data["scaler"]
        imputer = loaded_data["imputer"]
        print("✅ Success: ML Pipeline successfully loaded!")
    except Exception as e:
        print(f"❌ Model load karne me error: {e}")
else:
    print("⚠️ Warning: heart_model.pkl file nahi mili!")

# --- 📝 PYDANTIC SCHEMAS ---
class SignupModel(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class PredictionModel(BaseModel):
    user_id: str
    age: int
    sex: int
    cp: int          
    trestbps: int    
    chol: int        
    fbs: int         
    restecg: int     
    thalach: int     
    exang: int       
    oldpeak: float   
    slope: int       
    ca: int          
    thal: int        

# ==========================================================================
# 🔌 CRITICAL UPDATE: RESTRICTED TO PURELY AUTOMATED PREDICTION LOGS
# ==========================================================================

@app.post("/api/auth/signup")
def signup(data: SignupModel):
    if users_collection.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered!")
    inserted = users_collection.insert_one(data.model_dump())
    return {"message": "Account created!", "user_id": str(inserted.inserted_id)}

@app.post("/api/auth/login")
def login(data: LoginModel):
    user = users_collection.find_one({"email": data.email, "password": data.password})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid Email or Password!")
    return {"user_id": str(user["_id"]), "name": user["name"]}

@app.post("/api/predict")
def predict(data: PredictionModel):
    if svc_model is None or scaler is None:
        raise HTTPException(status_code=500, detail="ML Pipeline is not loaded.")
    
    try:
        # Feature Engineering Pipeline — MUST exactly match train_model.py's feature
        # engineering, or the scaler/imputer will see out-of-distribution values and
        # the model's predictions become unreliable (this bit us once already).
        age_thalach_ratio = data.age / (data.thalach + 1)
        bp_chol_product = (data.trestbps * data.chol) / 10000
        if data.age <= 40:
            age_group = 0
        elif data.age <= 55:
            age_group = 1
        elif data.age <= 70:
            age_group = 2
        else:
            age_group = 3

        raw_features = np.array([[
            data.age, data.sex, data.cp, data.trestbps, data.chol,
            data.fbs, data.restecg, data.thalach, data.exang,
            data.oldpeak, data.slope, data.ca, data.thal,
            age_thalach_ratio, bp_chol_product, age_group
        ]])
        
        imputed = imputer.transform(raw_features)
        scaled = scaler.transform(imputed)
        
        prediction = svc_model.predict(scaled)[0]

        # Use the model's actual probability for a meaningful risk % instead of just a bare label
        if hasattr(svc_model, "predict_proba"):
            proba = svc_model.predict_proba(scaled)[0]
            risk_score = round(float(proba[1]) * 100)  # probability of class 1 (HIGH RISK)
        else:
            risk_score = 85 if prediction == 1 else 15
        
        # Assemble structured medical payload
        record = {
            "user_id": ObjectId(data.user_id),
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "vitals": {
                "hr": data.thalach,
                "bp": f"{data.trestbps}/80" # Maps safely to standard UI formats
            },
            "risk_status": "HIGH RISK" if prediction == 1 else "LOW RISK",
            "risk_score": risk_score,
            "is_manual": False
        }
        predictions_collection.insert_one(record)
        
        return {"risk_status": record["risk_status"], "risk_score": risk_score}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/history/{user_id}")
def get_history(user_id: str):
    # Enforces hard exclusion of manual data directly at database query level
    cursor = predictions_collection.find({
        "user_id": ObjectId(user_id),
        "is_manual": False
    }).sort("timestamp", -1)
    
    return [{
        "date": item.get("timestamp"),
        "risk": item.get("risk_status"),
        "score": item.get("risk_score"),
        "vitals": item.get("vitals"),
        "is_manual": False
    } for item in cursor]