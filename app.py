from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os

# ---- Paths ----
SRC_DIR = os.path.join(os.path.dirname(__file__), 'src')

# ===============================
# Optional: TensorFlow
# ===============================
try:
    import tensorflow as tf
    model = tf.keras.models.load_model('nndl_churn_model.h5')
    print("[OK] TensorFlow model loaded.")
    TF_AVAILABLE = True
except Exception as e:
    print(f"[WARNING] TensorFlow not available: {e}")
    print("[INFO] Prediction routes will return dummy data.")
    TF_AVAILABLE = False
    model = None

# ===============================
# Optional: Gemini AI
# ===============================
import urllib.request
import json
try:
    GEMINI_API_KEY = "AQ.Ab8RN6JooO9c-2Ts4lr5fmXU8uFXOKIqIvD8PLXTVmWsRGpP4A"
    print("[OK] Gemini AI HTTP Request mode configured.")
    GEMINI_AVAILABLE = True
except Exception as e:
    print(f"[WARNING] Gemini AI not available: {e}")
    GEMINI_AVAILABLE = False

app = Flask(__name__)
app.secret_key = "be8877e65b2029695107d6455fc2e78fec4e3942f34d2bfa"
CORS(app)

# Load Other Assets
try:
    scaler = joblib.load('scaler.pkl')
    feature_cols = joblib.load('model_features.pkl')
    print("[OK] Scaler and feature columns loaded.")
    SCALER_AVAILABLE = True
except Exception as e:
    print(f"[WARNING] Could not load scaler/features: {e}")
    print("[INFO] Predictions will return dummy data.")
    scaler = None
    feature_cols = None
    SCALER_AVAILABLE = False

df = pd.read_csv('bank_customers_data.csv')
print(f"[OK] CSV loaded: {len(df)} customers across {df['bankId'].nunique()} banks.")

def analyze_bank_risks(bank_id):
    bank_df = df[df['bankId'] == bank_id].copy()
    if bank_df.empty or not TF_AVAILABLE or not SCALER_AVAILABLE:
        if not bank_df.empty:
            # Return consistent dummy predictions if TF/scaler not available
            rng = np.random.RandomState(42)
            bank_df['prob'] = rng.uniform(10, 95, size=len(bank_df))
        return bank_df
    X = bank_df.drop(columns=['customerId','bankId','name','bankName','managerId','managerName','Churn'], errors='ignore')
    X = pd.get_dummies(X, drop_first=True).reindex(columns=feature_cols, fill_value=0)
    preds = model.predict(scaler.transform(X)).flatten() * 100
    bank_df['prob'] = preds
    return bank_df

# ===============================
# Routes
# ===============================

@app.route("/")
def home():
    """Serve the main app from src/index.html"""
    return send_from_directory(SRC_DIR, "index.html")

@app.route("/<path:filename>")
def serve_files(filename):
    """Serve other HTML or generic files from src/"""
    return send_from_directory(SRC_DIR, filename)

@app.route("/assets/<path:filename>")
def serve_assets(filename):
    """Serve images and js from src/assets/"""
    return send_from_directory(os.path.join(SRC_DIR, 'assets'), filename)

@app.route("/static/css/<path:filename>")
def serve_css(filename):
    """Serve CSS files from src/css/"""
    return send_from_directory(os.path.join(SRC_DIR, 'css'), filename)

@app.route("/static/js/<path:filename>")
def serve_js(filename):
    """Serve JS files from src/js/"""
    return send_from_directory(os.path.join(SRC_DIR, 'js'), filename)

@app.route('/api/auth/login', methods=['POST'])
def login():
    creds = {
        "teja@icici.com": {"pass": "admin123", "name": "VENKATA TEJA", "bankId": "B2"},
        "bharath@sbi.com": {"pass": "admin123", "name": "BHARATH", "bankId": "B1"}
    }
    data = request.json
    email, password = data.get('email'), data.get('password')
    if email in creds and creds[email]['pass'] == password:
        return jsonify({"status": "success", "data": creds[email]})
    return jsonify({"status": "error"}), 401

@app.route('/api/bank/<bank_id>')
def get_bank_data(bank_id):
    bank_df = df[df['bankId'] == bank_id]
    if bank_df.empty:
        return jsonify({"error": "Bank not found"}), 404
    return jsonify({
        'bank_name': str(bank_df['bankName'].iloc[0]),
        'customers': bank_df[['customerId', 'name', 'tenure', 'monthlyCharges']].to_dict('records')
    })

@app.route('/api/upload_csv', methods=['POST'])
def upload_csv():
    global df
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Only CSV files are allowed"}), 400
    try:
        file.save('bank_customers_data.csv')
        df = pd.read_csv('bank_customers_data.csv')
        return jsonify({"status": "success", "message": f"Loaded {len(df)} customers."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict/all/<bank_id>')
def predict_all(bank_id):
    results_df = analyze_bank_risks(bank_id)
    if results_df.empty:
        return jsonify([])
    return jsonify(results_df[['customerId', 'prob']].to_dict('records'))

@app.route('/api/predict/single', methods=['POST'])
def predict_single():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Normally we would run `model.predict(scaler.transform([features]))`
    # Here we simulate with a dummy response for the frontend UI.
    rng = np.random.RandomState(42)
    prob = rng.uniform(5, 95)
    
    risk_level = "High" if prob >= 70 else "Medium" if prob >= 40 else "Low"
    is_high_risk = prob >= 50
    
    return jsonify({
        "status": "success",
        "probability": float(prob),
        "riskText": f"{risk_level} Risk of Churn",
        "reasons": [
            "Telecom Transfer Weight: Behavioral similarities to high-churn telco accounts",
            "Banking Target: Tenure drops align with source domain attrition metrics"
        ] if is_high_risk else [
            "Telecom Transfer Weight: Stability profile aligns with loyal subscriber networks",
            "Banking Target: Consistent engagement scores detected"
        ],
        "recommendations": ["Apply proactive cross-domain retention (e.g. loyalty incentives)"] if is_high_risk else ["Monitor using adapted baseline"]
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    msg = data.get('message', '').lower()
    bank_id = data.get('bankId', 'B2')
    results_df = analyze_bank_risks(bank_id)

    if "count" in msg and ("90" in msg or "high risk" in msg):
        count = len(results_df[results_df['prob'] > 90])
        return jsonify({"reply": f"Scanning the ledger... I found {count} customers with a churn risk over 90%."})

    if "hello" in msg or "hi" in msg:
        return jsonify({"reply": f"Greetings! I am active. We have {len(results_df)} customers loaded for analysis. What metrics shall we look at?"})
        
    if "average" in msg or "mean" in msg:
        avg_risk = results_df['prob'].mean() if not results_df.empty else 0
        return jsonify({"reply": f"The average churn risk probability across this bank branch is currently {avg_risk:.1f}%."})

    if "worst" in msg or "highest" in msg:
        if not results_df.empty:
            worst = results_df.loc[results_df['prob'].idxmax()]
            return jsonify({"reply": f"The highest risk profile is Customer {worst['customerId']} with a critical {worst['prob']:.1f}% probability of churn."})

    if "high churn" in msg or "high risk" in msg:
    high_risk = results_df[results_df['prob'] >= 70]

    if high_risk.empty:
        return jsonify({"reply": "No high churn customers found."})

    customers = high_risk[['customerId', 'prob']].head(5).to_dict('records')

    return jsonify({
        "reply": f"Here are the top high churn customers:\n{customers}"
    })
    if GEMINI_AVAILABLE:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {"contents": [{"parts": [{"text": f"You are Nexa AI for {bank_id}. Answer: {msg}"}]}]}
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                ai_reply = result['candidates'][0]['content']['parts'][0]['text']
                return jsonify({"reply": ai_reply})
        except Exception as e:
            return jsonify({"reply": f"AI Connection Error (Please verify your API Key in app.py): {str(e)}"})

    return jsonify({"reply": "I am operating in Offline Analytical Mode. (Python 3.6 limits remote cloud access, but local logic is available!)"})

if __name__ == '__main__':
    print("\n========================================")
    print("  Nexa AI Dashboard - Starting Server")
    print("  URL: http://localhost:5000")
    print("========================================\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
