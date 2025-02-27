from flask import Flask, render_template, request, jsonify
import joblib

app = Flask(__name__)

model = joblib.load("disease_prediction_model.pkl")
label_encoder = joblib.load("label_encoder.pkl")
vectorizer = joblib.load("vectorizer.pkl")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    symptom_text = data.get("symptoms")
    input_features = vectorizer.transform([symptom_text]).toarray()
    prediction = model.predict(input_features)
    disease_name = label_encoder.inverse_transform([prediction[0]])[0]
    return jsonify({"prediction": disease_name})

if __name__ == "__main__":
    app.run(debug=True)
