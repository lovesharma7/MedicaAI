import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Load dataset
df = pd.read_csv('dataset.csv')

# Features and target
X = df.drop(columns = ['Disease', 'Cure'])
y = df['Disease']

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
  X, y_encoded, test_size = 0.2, random_state = 42, stratify = y_encoded
)

# Train model
clf = RandomForestClassifier(n_estimators = 100, random_state = 42, n_jobs = -1)
clf.fit(X_train, y_train)

# Evaluate
y_pred = clf.predict(X_test)
print("Accuracy : ", accuracy_score(y_test, y_pred))
print("\nClassification Report :\n", classification_report(
  y_test, y_pred, target_names = le.classes_)
)

# Save model and encoder
joblib.dump(clf, 'chatbot_model.joblib')
joblib.dump(le, 'label_encoder.joblib')
print("Model and encoder saved successfully.")
