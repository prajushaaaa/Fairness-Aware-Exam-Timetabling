"""Tests for timetable solver engine and API endpoints."""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from services.solver_service import (
    load_synthetic_dataset,
    solve_greedy,
    solve_standard_ilp,
    solve_fairness_ilp,
)


@pytest.fixture
def client():
    """Create Flask test client."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def synthetic_data():
    """Load the actual synthetic dataset."""
    return load_synthetic_dataset()


def test_dataset_loading(synthetic_data):
    """Verify that dataset loads from CSV with 15 exams, 100 students, and actual conflict pairs."""
    assert len(synthetic_data.exams) == 15
    assert len(synthetic_data.students) == 100
    assert len(synthetic_data.time_slots) == 6
    assert len(synthetic_data.rooms) == 3
    assert len(synthetic_data.registrations) == 401
    assert len(synthetic_data.conflict_pairs) == 103


def test_greedy_synthetic_6_slots(synthetic_data):
    """Greedy on 6 slots should report Infeasible because 103 clashes require more slots."""
    result = solve_greedy(synthetic_data, num_slots=6)
    assert result["method"] == "greedy"
    assert result["status"] == "Infeasible"
    assert result["error"] is not None
    assert len(result["schedule"]) == 0


def test_standard_ilp_synthetic_6_slots(synthetic_data):
    """Standard ILP on 6 slots should prove mathematical Infeasibility without crashing."""
    result = solve_standard_ilp(synthetic_data, num_slots=6, time_limit=10)
    assert result["method"] == "standard_ilp"
    assert result["status"] == "Infeasible"
    assert "Infeasible" in result["error"]


def test_fairness_ilp_synthetic_6_slots(synthetic_data):
    """Fairness ILP on 6 slots should prove mathematical Infeasibility without crashing."""
    result = solve_fairness_ilp(synthetic_data, fairness_weight=0.5, num_slots=6, time_limit=10)
    assert result["method"] == "fairness_ilp"
    assert result["status"] == "Infeasible"
    assert "Infeasible" in result["error"]


def test_greedy_feasible_15_slots(synthetic_data):
    """With 15 slots, Greedy should successfully schedule all 15 exams with 0 hard violations."""
    result = solve_greedy(synthetic_data, num_slots=15)
    assert result["method"] == "greedy"
    assert result["status"] == "Feasible"
    assert result["hard_constraint_violations"] == 0
    assert len(result["schedule"]) == 15
    assert result["error"] is None
    assert result["maximum_student_burden"] >= 0


def test_standard_ilp_feasible_15_slots(synthetic_data):
    """With 15 slots, Standard ILP should find a valid timetable with 0 hard violations."""
    result = solve_standard_ilp(synthetic_data, num_slots=15, time_limit=15)
    assert result["method"] == "standard_ilp"
    assert result["status"] in ("Optimal", "Feasible")
    assert result["hard_constraint_violations"] == 0
    assert len(result["schedule"]) == 15
    assert result["error"] is None


def test_fairness_ilp_feasible_15_slots(synthetic_data):
    """With 15 slots, Fairness ILP should find a valid timetable with bounded student burden."""
    result = solve_fairness_ilp(synthetic_data, fairness_weight=0.5, num_slots=15, time_limit=15)
    assert result["method"] == "fairness_ilp"
    assert result["status"] in ("Optimal", "Feasible")
    assert result["hard_constraint_violations"] == 0
    assert len(result["schedule"]) == 15
    assert result["error"] is None


def test_api_generate_greedy(client):
    """Test API POST /api/timetable/generate with greedy method."""
    resp = client.post(
        "/api/timetable/generate",
        json={"method": "greedy", "dataset_type": "synthetic"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["method"] == "greedy"
    assert data["status"] == "Infeasible"


def test_api_generate_with_slot_override(client):
    """Test API POST /api/timetable/generate with 15 slots producing valid schedule."""
    resp = client.post(
        "/api/timetable/generate",
        json={"method": "greedy", "dataset_type": "synthetic", "time_slots": 15},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["method"] == "greedy"
    assert data["status"] == "Feasible"
    assert data["hard_constraint_violations"] == 0
    assert len(data["schedule"]) == 15


def test_api_invalid_method(client):
    """Test API POST /api/timetable/generate with invalid method returns 400."""
    resp = client.post(
        "/api/timetable/generate",
        json={"method": "genetic_algorithm", "dataset_type": "synthetic"},
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "Error"
    assert "Unsupported timetabling method" in data["error"]
