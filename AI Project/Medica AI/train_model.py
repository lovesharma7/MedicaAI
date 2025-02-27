import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

df = pd.read_csv("Symptom2Disease.csv")
df.drop(columns=["Unnamed: 0"], inplace=True)
label_encoder = LabelEncoder()
df["label"] = label_encoder.fit_transform(df["label"])
joblib.dump(label_encoder, "label_encoder.pkl")
vectorizer = TfidfVectorizer(max_features=500)
X = vectorizer.fit_transform(df["text"]).toarray()
joblib.dump(vectorizer, "vectorizer.pkl")
y = df["label"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy * 100:.2f}%")
joblib.dump(model, "disease_prediction_model.pkl")
print("Model, Label Encoder, and Vectorizer saved successfully!")
