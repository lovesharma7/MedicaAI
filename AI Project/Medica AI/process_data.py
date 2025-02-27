import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder

df = pd.read_csv("Symptom2Disease.csv")
df.drop(columns=["Unnamed: 0"], inplace=True)

print("Initial Data:\n", df.head())

label_encoder = LabelEncoder()
df["label"] = label_encoder.fit_transform(df["label"])

vectorizer = TfidfVectorizer(max_features=500)
X = vectorizer.fit_transform(df["text"]).toarray()
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

processed_df = pd.DataFrame(X, columns=[f"feature_{i}" for i in range(X.shape[1])])
processed_df["Disease"] = y.values
processed_df.to_csv("processed_data.csv", index=False)

print(f"\nProcessed Data Shape: {processed_df.shape}")
print(f"Training Data: {X_train.shape}, Testing Data: {X_test.shape}")
