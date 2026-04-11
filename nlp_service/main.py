import sys

try:
    from flask import Flask, request, jsonify
except ImportError:
    print("Error: Flask is not installed. Python NLP service cannot start.")
    # Fallback to a very basic mock if flask is missing? 
    # No, if flask is missing we can't run the web server.
    sys.exit(1)

try:
    from .models import ExpertAIModel
    from .config import AI_PERSONALITY, MODEL_NAME
except ImportError as e:
    print(f"Error: Could not import models or config: {e}")
    # Create a mock model if imports fail
    class ExpertAIModel:
        def __init__(self):
            print("Warning: Running in mock mode due to missing dependencies.")
        def generate_chat_response(self, text, chat_history_ids=None):
            return "Expert AI is currently in mock mode (missing dependencies).", None
        def summarize_text(self, text):
            return f"Mock Summary: {text[:50]}..."
        def analyze_sentiment(self, text):
            return "Mock Analysis: Neutral"
    AI_PERSONALITY = "Mock Personality"
    MODEL_NAME = "mock-model"

app = Flask(__name__)

# Initialize the Expert AI Model
try:
    ai_model = ExpertAIModel()
except Exception as e:
    print(f"Error initializing model: {e}")
    ai_model = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online" if ai_model else "error",
        "model": MODEL_NAME,
        "mode": "mock" if "Mock" in AI_PERSONALITY else "expert"
    })

@app.route('/process', methods=['POST'])
def process_nlp():
    if not ai_model:
        return jsonify({"error": "Model not initialized", "result": "Expert AI is offline."}), 503
        
    data = request.json
    text = data.get('text', '')
    command = data.get('command', '')
    context = data.get('context', '')
    chat_history_ids = data.get('chat_history_ids', None) # For multi-turn memory
    
    print(f"Expert AI processing: {command}")
    
    reply = ""
    
    if command == "chat" or command == "buddy":
        # Prepend the personality context for the first message
        if not chat_history_ids:
            text = f"{AI_PERSONALITY}\nUser: {text}"
            
        reply, chat_history_ids = ai_model.generate_chat_response(text, chat_history_ids)
        
    elif command == "summarize":
        reply = ai_model.summarize_text(text)
    
    elif command == "sentiment":
        reply = ai_model.analyze_sentiment(text)

    return jsonify({
        "result": reply,
        "chat_history_ids": chat_history_ids
    })

if __name__ == '__main__':
    # Run the Expert AI service on port 5000
    print("Expert Python AI Service starting on port 5000...")
    app.run(host='0.0.0.0', port=5000)
