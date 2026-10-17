"""Tests for dataset upload, validation, parsing, and statistics APIs."""

import io
import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from routes.dataset import set_active_dataset


@pytest.fixture
def client():
    """Create and configure a test client for the Flask app."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client
    set_active_dataset(None)


def test_upload_no_files(client):
    """Uploading with no files should return HTTP 400."""
    response = client.post("/api/dataset/upload", data={})
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"
    assert "No files provided" in data["message"]


def test_upload_empty_filename(client):
    """Uploading file with empty filename should be rejected."""
    data = {
        "exam_file": (io.BytesIO(b"some content"), ""),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"


def test_upload_zero_byte_file(client):
    """Uploading a 0-byte file should return HTTP 400."""
    data = {
        "exam_file": (io.BytesIO(b""), "empty.exam"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"
    assert any("empty (0 bytes)" in err for err in data["errors"])


def test_upload_disallowed_extension(client):
    """Uploading files with forbidden extensions should be rejected."""
    data = {
        "exam_file": (io.BytesIO(b"malicious content"), "script.exe"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    res_data = response.get_json()
    assert res_data["status"] == "error"
    assert "not permitted" in res_data["message"]


def test_upload_itc2007_format(client):
    """Test uploading an ITC2007 benchmark format .exam file."""
    itc_content = (
        "[Exams:3]\n"
        "E1 180\n"
        "E2 120\n"
        "E3 180\n"
        "[Periods:4]\n"
        "P1, 01:06:2026, 09:00:00, 180, 0\n"
        "P2, 01:06:2026, 14:00:00, 180, 0\n"
        "P3, 02:06:2026, 09:00:00, 180, 0\n"
        "P4, 02:06:2026, 14:00:00, 180, 0\n"
        "[Rooms:2]\n"
        "R1 100 0\n"
        "R2 80 0\n"
        "[Enrollments]\n"
        "s1 E1\n"
        "s1 E2\n"
        "s2 E2\n"
        "s2 E3\n"
        "s3 E1\n"
        "s3 E3\n"
    )

    data = {
        "exam_file": (io.BytesIO(itc_content.encode("utf-8")), "itc_test.exam"),
        "dataset_name": "ITC2007 Test Instance",
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    res = response.get_json()
    assert res["status"] == "success"
    assert res["name"] == "ITC2007 Test Instance"
    assert res["format_type"] == "itc2007"

    stats = res["statistics"]
    assert stats["num_examinations"] == 3
    assert stats["num_students"] == 3
    assert stats["num_periods"] == 4
    assert stats["num_rooms"] == 2
    # s1 shares (E1, E2), s2 shares (E2, E3), s3 shares (E1, E3) -> 3 conflicting pairs
    assert stats["num_conflicts"] == 3
    assert stats["conflict_density"] == 1.0
    assert stats["total_enrollments"] == 6


def test_upload_carter_split_format(client):
    """Test uploading Carter/Toronto benchmark format with separate .crs, .stu, and .slo files."""
    crs_content = "101 2\n102 2\n103 1\n"
    stu_content = "s1 101 102\ns2 101 103\n"
    slo_content = "12\n"

    data = {
        "exam_file": (io.BytesIO(crs_content.encode("utf-8")), "hec-s-92.crs"),
        "stu_file": (io.BytesIO(stu_content.encode("utf-8")), "hec-s-92.stu"),
        "room_file": (io.BytesIO(slo_content.encode("utf-8")), "hec-s-92.slo"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    res = response.get_json()
    assert res["status"] == "success"
    stats = res["statistics"]
    assert stats["num_examinations"] == 3
    assert stats["num_students"] == 2
    assert stats["num_periods"] == 12
    # s1 has (101, 102), s2 has (101, 103) -> 2 conflicts
    assert stats["num_conflicts"] == 2


def test_upload_csv_format_with_separate_rooms(client):
    """Test uploading CSV format student registrations and rooms file."""
    enrollments_csv = (
        "student_id,exam_id\n"
        "STU_001,CS101\n"
        "STU_001,MA201\n"
        "STU_002,CS101\n"
        "STU_002,PH101\n"
    )
    rooms_csv = (
        "room_id,capacity\n"
        "Hall_A,150\n"
        "Hall_B,80\n"
    )

    data = {
        "exam_file": (io.BytesIO(enrollments_csv.encode("utf-8")), "registrations.csv"),
        "room_file": (io.BytesIO(rooms_csv.encode("utf-8")), "campus_rooms.csv"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    res = response.get_json()
    stats = res["statistics"]
    assert stats["num_examinations"] == 3  # CS101, MA201, PH101
    assert stats["num_students"] == 2
    assert stats["num_rooms"] == 2


def test_upload_invalid_room_capacity_negative(client):
    """Uploading room data with negative capacity must be rejected."""
    enrollments = "s1 E1 E2\n"
    rooms = "room_id,capacity\nR1,-50\n"

    data = {
        "stu_file": (io.BytesIO(enrollments.encode("utf-8")), "test.stu"),
        "room_file": (io.BytesIO(rooms.encode("utf-8")), "rooms.csv"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    res = response.get_json()
    assert res["status"] == "error"
    assert any("capacity must be positive" in err for err in res["errors"])


def test_upload_invalid_room_capacity_non_numeric(client):
    """Uploading room data with non-numeric capacity must be rejected."""
    enrollments = "s1 E1 E2\n"
    rooms = "R1 INVALID_CAPACITY\n"

    data = {
        "stu_file": (io.BytesIO(enrollments.encode("utf-8")), "test.stu"),
        "room_file": (io.BytesIO(rooms.encode("utf-8")), "rooms.room"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    res = response.get_json()
    assert res["status"] == "error"
    assert any("Expected room capacity integer" in err for err in res["errors"])


def test_upload_missing_enrollments(client):
    """Exam file with exams but zero student enrollments must be rejected."""
    exam_content = (
        "[Exams:2]\n"
        "101 180\n"
        "102 180\n"
    )
    data = {
        "exam_file": (io.BytesIO(exam_content.encode("utf-8")), "no_enrollments.exam"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    res = response.get_json()
    assert res["status"] == "error"
    assert any("No student enrollments were found" in err for err in res["errors"])


def test_upload_valid_minimal_dataset(client):
    """Minimal dataset with exactly 1 exam and 1 student enrollment."""
    itc_min = (
        "[Exams:1]\n"
        "EX101 180\n"
        "[Enrollments]\n"
        "STU1 EX101\n"
    )
    data = {
        "exam_file": (io.BytesIO(itc_min.encode("utf-8")), "min.exam"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    res = response.get_json()
    stats = res["statistics"]
    assert stats["num_examinations"] == 1
    assert stats["num_students"] == 1
    assert stats["num_conflicts"] == 0
    assert stats["conflict_density"] == 0.0
    assert stats["total_enrollments"] == 1


def test_conflict_density_exact_calculation(client):
    """Verify conflict graph calculation with a known 4-exam cycle topology."""
    # 4 exams: E1, E2, E3, E4
    # S1 takes E1, E2 -> conflict (E1, E2)
    # S2 takes E2, E3 -> conflict (E2, E3)
    # S3 takes E3, E4 -> conflict (E3, E4)
    # S4 takes E1, E4 -> conflict (E1, E4)
    # Total possible pairs: 4 * 3 / 2 = 6
    # Active conflicts: 4 (E1-E2, E2-E3, E3-E4, E1-E4).
    # Non-conflicting: (E1, E3), (E2, E4).
    # Conflict density = 4 / 6 = 0.6667
    itc_content = (
        "[Exams:4]\n"
        "E1 180\nE2 180\nE3 180\nE4 180\n"
        "[Enrollments]\n"
        "S1 E1\nS1 E2\n"
        "S2 E2\nS2 E3\n"
        "S3 E3\nS3 E4\n"
        "S4 E1\nS4 E4\n"
    )
    data = {
        "exam_file": (io.BytesIO(itc_content.encode("utf-8")), "cycle4.exam"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    res = response.get_json()
    stats = res["statistics"]
    assert stats["num_examinations"] == 4
    assert stats["num_students"] == 4
    assert stats["num_conflicts"] == 4
    assert stats["conflict_density"] == 0.6667
    assert stats["total_enrollments"] == 8


def test_path_traversal_sanitization(client):
    """Filename containing directory traversal characters must be safely sanitized."""
    content = "s1 E1 E2\n"
    data = {
        "stu_file": (io.BytesIO(content.encode("utf-8")), "../../evil_test.stu"),
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    res = response.get_json()
    # Stored filename must not have directory traversal
    stored_name = res["files"]["stu_file"]
    assert ".." not in stored_name
    assert "/" not in stored_name
    assert "\\" not in stored_name


def test_get_and_delete_current_dataset(client):
    """Test GET and DELETE /api/dataset/current endpoints."""
    # Initially empty
    res = client.get("/api/dataset/current")
    assert res.status_code == 200
    assert res.get_json()["status"] == "empty"

    # Upload valid dataset
    itc_content = (
        "[Exams:2]\n"
        "101 180\n"
        "102 180\n"
        "[Enrollments]\n"
        "s1 101\n"
        "s1 102\n"
    )
    client.post(
        "/api/dataset/upload",
        data={"exam_file": (io.BytesIO(itc_content.encode("utf-8")), "simple.exam")},
        content_type="multipart/form-data"
    )

    # Current should return dataset details
    res = client.get("/api/dataset/current")
    assert res.status_code == 200
    current_data = res.get_json()
    assert current_data["status"] == "success"
    assert current_data["dataset"]["statistics"]["num_examinations"] == 2

    # Reset
    res = client.delete("/api/dataset/current")
    assert res.status_code == 200
    assert res.get_json()["status"] == "success"

    # Should be empty again
    res = client.get("/api/dataset/current")
    assert res.get_json()["status"] == "empty"


def test_upload_simple_two_column_csv_with_time_slots(client):
    """Test simple examination dataset with exam_id, student_id and custom time_slots."""
    csv_content = (
        "exam_id,student_id\n"
        "CS101,S1\n"
        "MA201,S1\n"
        "CS101,S2\n"
        "PH101,S2\n"
        "MA201,S3\n"
        "PH101,S3\n"
    )
    data = {
        "exam_file": (io.BytesIO(csv_content.encode("utf-8")), "simple_demo.csv"),
        "time_slots": "4",
        "dataset_name": "Simple Demo Dataset",
    }
    response = client.post(
        "/api/dataset/upload",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 200
    res = response.get_json()
    stats = res["statistics"]
    assert stats["num_examinations"] == 3
    assert stats["num_students"] == 3
    assert stats["num_periods"] == 4
    assert stats["num_conflicts"] == 3

