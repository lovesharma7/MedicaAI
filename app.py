from flask import Flask, request, jsonify, render_template, send_from_directory
import os
from predict_disease import DiseasePredictor

app = Flask(__name__, static_folder='static')

predictor = None

def load_predictor():
    global predictor
    if predictor is None:
        try:
            predictor = DiseasePredictor(model_dir='models')
            print("✅ Predictor loaded!")
        except Exception as e:
            print("❌ Predictor failed to load:", e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    global predictor
    load_predictor()
    
    if predictor is None:
        return jsonify({'error': 'Model not loaded. Please try again later.'}), 500

    try:
        data = request.json
        symptoms = data.get('symptoms', '')

        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400

        results = predictor.predict_and_info(symptoms)
        messages = format_results_for_chat(results)

        return jsonify({
            'status': 'success',
            'messages': messages,
            'raw_results': results
        }), 200

    except Exception as e:
        app.logger.error(f"Error in prediction: {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/api/symptoms')
def get_symptoms():
    global predictor
    load_predictor()

    if predictor is None:
        return jsonify({'error': 'Model not loaded. Please try again later.'}), 500

    return jsonify({
        'status': 'success',
        'symptoms': predictor.symptom_list
    }), 200

def format_results_for_chat(results):
    messages = []

    if 'error' in results:
        messages.append({
            'type': 'text',
            'content': f"⚠️ {results['error']}"
        })

        if results.get('suggestions'):
            suggestions_text = "Did you mean:\n"
            for original, suggestions in results['suggestions']:
                suggestions_text += f"• {original} → {', '.join(suggestions)}\n"
            messages.append({
                'type': 'text',
                'content': suggestions_text
            })
        return messages

    pred = results['top_prediction']
    messages.append({
        'type': 'prediction',
        'disease': pred['disease'],
        'probability': f"{pred['probability']*100:.1f}%",
        'description': pred['description']
    })

    if pred['precautions']:
        precautions_text = "⚠️ Recommended Precautions:\n"
        for p in pred['precautions']:
            precautions_text += f"• {p}\n"
        messages.append({
            'type': 'precautions',
            'content': precautions_text
        })

    if results['alternative_predictions']:
        alt_text = "🔄 Alternative possibilities:\n"
        for alt in results['alternative_predictions']:
            alt_text += f"• {alt['disease']} ({alt['probability']*100:.1f}%)\n"
        messages.append({
            'type': 'alternatives',
            'content': alt_text
        })

    symptom_text = "🩺 Symptom Severity Analysis:\n"
    for detail in results['symptom_details']:
        symptom_text += f"• {detail['symptom']}: {detail['severity']} out of 7\n"
    messages.append({
        'type': 'symptoms',
        'content': symptom_text
    })

    return messages

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(debug=True, host='0.0.0.0', port=port)
