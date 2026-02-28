import sys
import os

# Ensure backend and api directories are in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))

from flask import Flask, jsonify
from flask_cors import CORS
from api.routes import api_bp

app = Flask(__name__)
# Enable CORS for frontend integration
CORS(app)

# Register the blueprint from api/routes.py
app.register_blueprint(api_bp)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    # Run on http://localhost:5000
    app.run(host='127.0.0.1', port=5000, debug=True)
