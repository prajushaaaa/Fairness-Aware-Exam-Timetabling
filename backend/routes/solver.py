"""Timetable generation API routes using Operations Research solvers."""

from pathlib import Path
from flask import Blueprint, request, jsonify

from routes.dataset import get_active_dataset
from services.solver_service import (
    load_synthetic_dataset,
    exam_dataset_to_timetabling_dataset,
    solve_greedy,
    solve_standard_ilp,
    solve_fairness_ilp,
)

solver_bp = Blueprint("solver", __name__, url_prefix="/api/timetable")


@solver_bp.route("/generate", methods=["POST"])
def generate_timetable():
    """Generate an examination timetable using one of three OR methods.
    
    Expected JSON payload:
    {
      "method": "greedy" | "standard_ilp" | "fairness_ilp",
      "fairness_weight": 0.5,
      "dataset_type": "synthetic" | "active",
      "time_slots": 6 (optional override)
    }
    """
    data = request.get_json(silent=True) or {}

    method = data.get("method", "greedy").strip().lower()
    fairness_weight = float(data.get("fairness_weight", 0.5))
    dataset_type = data.get("dataset_type", "synthetic").strip().lower()
    requested_slots = data.get("time_slots")
    if requested_slots is not None:
        try:
            requested_slots = int(requested_slots)
            if requested_slots <= 0:
                requested_slots = None
        except (ValueError, TypeError):
            requested_slots = None

    # Load dataset
    try:
        active_ds = get_active_dataset()
        if dataset_type == "synthetic" or (active_ds and active_ds.dataset_id == "synthetic_dataset"):
            base_dir = Path(__file__).resolve().parent.parent / "data" / "synthetic_dataset"
            dataset = load_synthetic_dataset(base_dir)
        elif active_ds:
            dataset = exam_dataset_to_timetabling_dataset(active_ds, requested_slots=requested_slots)
        else:
            base_dir = Path(__file__).resolve().parent.parent / "data" / "synthetic_dataset"
            dataset = load_synthetic_dataset(base_dir)
    except Exception as e:
        return jsonify({
            "method": method,
            "status": "Error",
            "schedule": [],
            "runtime": 0.0,
            "hard_constraint_violations": 0,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"Failed to load dataset: {str(e)}",
        }), 400

    # Execute selected algorithm
    if method == "greedy":
        result = solve_greedy(dataset, num_slots=requested_slots)
    elif method == "standard_ilp":
        result = solve_standard_ilp(dataset, num_slots=requested_slots, time_limit=20)
    elif method == "fairness_ilp":
        result = solve_fairness_ilp(
            dataset,
            fairness_weight=fairness_weight,
            num_slots=requested_slots,
            time_limit=20,
        )
    else:
        return jsonify({
            "method": method,
            "status": "Error",
            "schedule": [],
            "runtime": 0.0,
            "hard_constraint_violations": 0,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"Unsupported timetabling method '{method}'. Supported: 'greedy', 'standard_ilp', 'fairness_ilp'.",
        }), 400

    status_code = 200
    if result.get("status") == "Error":
        status_code = 500

    return jsonify(result), status_code
