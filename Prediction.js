const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    chestPainType: { type: Number, required: true },
    restingBP: { type: Number, required: true },
    cholesterol: { type: Number, required: true },
    fastingBloodSugar: { type: Number, required: true },
    ecgResults: { type: Number, required: true },
    maxHeartRate: { type: Number, required: true },
    exerciseAngina: { type: Number, required: true },
    stDepression: { type: Number, required: true },
    stSlope: { type: Number, required: true },
    majorVessels: { type: Number, required: true },
    thalassemia: { type: Number, required: true },
    // The calculated results
    riskProbability: { type: Number, required: true }, // e.g., 12 for 12%
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    datePredicted: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    name: String,
    prediction: Number,
    confidence: Number,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prediction', predictionSchema);