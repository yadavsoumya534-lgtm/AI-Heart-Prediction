import os
from pymongo import MongoClient
from dotenv import load_dotenv

# .env file se configurations load karne ke liye
load_dotenv()

# MongoDB connection link (agar .env me na ho toh default local chalega)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Mongo client initialization
client = MongoClient(MONGO_URI)

# Database name setup
db = client["healthpredict_db"]

# Collections (Tables) export ho rahi hain main.py ke liye
users_collection = db["users"]
predictions_collection = db["predictions"]