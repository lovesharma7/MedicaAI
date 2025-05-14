import pandas as pd
import joblib

# Load model and encoder
model = joblib.load('chatbot_model.joblib')
encoder = joblib.load('label_encoder.joblib')

# Load dataset to get symptom columns and cures
df = pd.read_csv('dataset.csv')
symptom_columns = df.drop(columns = ['Disease', 'Cure']).columns.str.lower()
original_columns = df.drop(columns = ['Disease', 'Cure']).columns
cure_map = df[['Disease', 'Cure']].drop_duplicates().set_index('Disease')['Cure'].to_dict()

# Initialize input vector
input_data = dict.fromkeys(original_columns, 0)

# Take user input
user_input = input("Enter your symptoms, separated by commas :\n> ")
entered_symptoms = [s.strip().lower() for s in user_input.split(',')]

# Match symptoms to columns
for symptom in entered_symptoms:
  if symptom in symptom_columns.values:
    matched_col = original_columns[symptom_columns == symptom][0]
    input_data[matched_col] = 1
  else:
    print(f"❌ Symptom '{symptom}' not recognized and will be ignored.")

# Create input DataFrame
input_df = pd.DataFrame([input_data])

# Predict
pred_idx = model.predict(input_df)[0]
pred_disease = encoder.inverse_transform([pred_idx])[0]
pred_cure = cure_map.get(pred_disease, "Cure not found.")

# Output result
print("\n✅ Prediction Complete:")
print("Predicted Disease : ", pred_disease)
print("Recommended Cure : ", pred_cure)
