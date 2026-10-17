import os
import sys
from flask import Flask
from flask_cors import CORS

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routes.health import health_bp
from routes.dataset import dataset_bp
from routes.solver import solver_bp


def create_app():
    """Application factory for the Flask backend."""
    app = Flask(__name__)
    
    # Enable Cross-Origin Resource Sharing for frontend communication
    CORS(app)
    
    # Register API blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(dataset_bp)
    app.register_blueprint(solver_bp)
    
    return app


if __name__ == "__main__":
    app = create_app()
    print("Starting Flask development server on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
