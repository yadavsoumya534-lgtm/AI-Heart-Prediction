from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)
CORS(app) # Crucial: Allows your frontend to talk to this port

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["healthpredict_db"]
collection = db["predictions"]

@app.route('/api/save-prediction', methods=['POST'])
def save_prediction():
    try:
        data = request.json
        data['date'] = datetime.now().strftime("%d %b %Y") # Add timestamp
        
        # Insert into MongoDB
        result = collection.insert_one(data)
        
        # Return success with the new MongoDB ID
        return jsonify({
            "message": "Prediction saved successfully!", 
            "id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)

    # Add this to app.py
@app.route('/api/get-history', methods=['GET'])
def get_history():
    # Fetch all, sort by newest
    cursor = collection.find().sort('_id', -1) 
    history = []
    for doc in cursor:
        doc['_id'] = str(doc['_id']) # Convert Mongo ID to string
        history.append(doc)
    return jsonify(history), 200