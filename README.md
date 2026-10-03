# ❤️ AI Heart Prediction

A web application that predicts the risk of heart disease using machine learning. Users enter their medical details and get an instant risk result, along with a history of past predictions and simple health recommendations.

---

## ✨ Features

- 🩺 Heart disease risk prediction from 13 medical parameters
- 📊 Risk score (%) with a High / Low risk status
- 🔐 User signup and login
- 🖥️ Dashboard with vitals and trend chart
- 🕒 Prediction history and health records
- 📈 Charts and trends of past results
- 💡 Recommendations based on the latest risk score

---

## 🛠️ Tech Stack

- 🎨 **Frontend:** HTML, CSS, JavaScript, Chart.js
- ⚙️ **Backend:** Python, FastAPI
- 🗄️ **Database:** MongoDB
- 🤖 **Machine Learning:** scikit-learn, pandas, NumPy, imbalanced-learn

---

## 🧠 How the Model Works

`train_model.py` trains and compares five models: Logistic Regression, Random Forest, Gradient Boosting, SVM and KNN. Steps include:

1. 🧹 Cleaning the data and filling missing values (median)
2. 🧩 Adding three extra features (age/heart-rate ratio, BP x cholesterol, age group)
3. ⚖️ Balancing the training data with SMOTE
4. 📏 Scaling the features and comparing models using 10-fold cross-validation
5. 🏆 Saving the best model (by test AUC) to `heart_model.pkl`

📄 A training report with charts is saved as `training_report.png`.

---

## 📂 Project Structure

```
├── main.py              # FastAPI backend
├── database.py          # MongoDB connection
├── train_model.py       # Model training
├── predict.py           # Standalone prediction script
├── heart_model.pkl      # Saved model
├── heart_merged.csv     # Dataset
├── requirements.txt
├── index.html           # Login page
├── signup.html
├── dashboard.html
├── heart-prediction.html
├── my-history.html
├── health-records.html
├── charts-trends.html
├── recommendations.html
├── profile-settings.html
├── script.js
└── style.css
```

---

## 🚀 How to Run

1. 📦 Install dependencies:
```
   pip install -r requirements.txt
```
2. 🗄️ Start MongoDB on `mongodb://localhost:27017` (or set `MONGO_URI` in a `.env` file).
3. ▶️ Start the backend:
```
   uvicorn main:app --reload
```
4. 🌐 Open `index.html` in your browser.

🔁 To retrain the model:
```
python train_model.py
```

---

## ⚠️ Note

This project is for learning and demonstration only. It is not a medical tool and should not be used for real diagnosis.
