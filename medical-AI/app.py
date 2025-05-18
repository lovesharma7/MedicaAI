from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)

# Load model and encoders
model = joblib.load('chatbot_model.joblib')
encoder = joblib.load('label_encoder.joblib')
df = pd.read_csv('dataset.csv')

# Extract column names and cure mapping
symptom_columns = df.drop(columns = ['Disease', 'Cure']).columns.str.lower()
original_columns = df.drop(columns = ['Disease', 'Cure']).columns
cure_map = df[['Disease', 'Cure']].drop_duplicates().set_index('Disease')['Cure'].to_dict()

@app.route('/')
def home():
  return render_template('index.html')

@app.route('/predict', methods = ['POST'])
def predict():
  data = request.get_json()
  symptoms_input = [s.strip().lower() for s in data['symptoms'].split(',')]

  input_data = dict.fromkeys(original_columns, 0)
  for symptom in symptoms_input:
    if symptom in symptom_columns.values:
      matched_col = original_columns[symptom_columns == symptom][0]
      input_data[matched_col] = 1

  input_df = pd.DataFrame([input_data])
  pred_idx = model.predict(input_df)[0]
  pred_disease = encoder.inverse_transform([pred_idx])[0]
  pred_cure = cure_map.get(pred_disease, "Cure not found.")

  return jsonify({'disease': pred_disease, 'cure': pred_cure})

if __name__ == '__main__':
  app.run(debug=True)
