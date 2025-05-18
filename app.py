# File: app.py
from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import json
from predict_disease import DiseasePredictor

app = Flask(__name__, static_folder='static')

# Initialize the disease predictor
predictor = DiseasePredictor(model_dir='models')

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    """API endpoint for disease prediction"""
    try:
        data = request.json
        symptoms = data.get('symptoms', '')
        
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
            
        # Get prediction results
        results = predictor.predict_and_info(symptoms)
        
        # Format results for the chat interface
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
    """API endpoint for getting symptom suggestions"""
    try:
        # Return the list of all symptoms for autocomplete
        return jsonify({
            'status': 'success',
            'symptoms': predictor.symptom_list
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get symptoms: {str(e)}'}), 500

def format_results_for_chat(results):
    """Format prediction results as chat messages"""
    messages = []
    
    # Check if there was an error
    if 'error' in results:
        messages.append({
            'type': 'text',
            'content': f"⚠️ {results['error']}"
        })
        
        # Add suggestions for unrecognized symptoms
        if results.get('suggestions'):
            suggestions_text = "Did you mean:\n"
            for original, suggestions in results['suggestions']:
                suggestions_text += f"• {original} → {', '.join(suggestions)}\n"
            messages.append({
                'type': 'text',
                'content': suggestions_text
            })
        return messages
    
    # Primary prediction message
    pred = results['top_prediction']
    messages.append({
        'type': 'prediction',
        'disease': pred['disease'],
        'probability': f"{pred['probability']*100:.1f}%",
        'description': pred['description']
    })
    
    # Precautions message if available
    if pred['precautions']:
        precautions_text = "⚠️ Recommended Precautions:\n"
        for p in pred['precautions']:
            precautions_text += f"• {p}\n"
        messages.append({
            'type': 'precautions',
            'content': precautions_text
        })
    
    # Alternative predictions if available
    if results['alternative_predictions']:
        alt_text = "🔄 Alternative possibilities:\n"
        for alt in results['alternative_predictions']:
            alt_text += f"• {alt['disease']} ({alt['probability']*100:.1f}%)\n"
        messages.append({
            'type': 'alternatives',
            'content': alt_text
        })
    
    # Symptom analysis
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
    """Serve favicon"""
    return send_from_directory(os.path.join(app.root_path, 'static'), 
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
