import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

model = joblib.load("disease_prediction_model.pkl")
df = pd.read_csv("Symptom2Disease.csv")
df.drop(columns=["Unnamed: 0"], inplace=True)

vectorizer = TfidfVectorizer(max_features=500)
vectorizer.fit(df["text"])  

label_encoder = joblib.load("label_encoder.pkl")  # ✅ Load the correct label encoder

def predict_disease(symptom_text):
    input_features = vectorizer.transform([symptom_text]).toarray()
    prediction = model.predict(input_features)
    disease_name = label_encoder.inverse_transform([prediction[0]])[0]  # ✅ Convert number to name
    return disease_name

user_input = input("Enter symptoms description: ")
predicted_disease = predict_disease(user_input)

print(f"🩺 Predicted Disease: {predicted_disease}")
