from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)

@health_bp.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return jsonify({
        "status": "healthy",
        "message": "Backend is running successfully",
        "service": "Fairness-Aware Examination Timetabling API"
    }), 200
