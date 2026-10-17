"""Dataset upload and validation API routes."""

import json
import os
from typing import Optional
from flask import Blueprint, request, jsonify

from services.file_service import FileService, FileSecurityError
from services.parser_service import DatasetParserService, DatasetValidationError
from models.dataset import ExamDataset

dataset_bp = Blueprint("dataset", __name__, url_prefix="/api/dataset")

file_service = FileService()
parser_service = DatasetParserService()

# Global in-memory active dataset store
_ACTIVE_DATASET: Optional[ExamDataset] = None


def load_synthetic_exam_dataset() -> ExamDataset:
    """Load the project synthetic dataset as a full ExamDataset model."""
    import csv
    from pathlib import Path
    from models.dataset import Exam, Room, Period

    base_dir = Path(__file__).resolve().parent.parent / "data" / "synthetic_dataset"

    exams = {}
    if (base_dir / "exams.csv").exists():
        with open(base_dir / "exams.csv", "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                eid = row["exam_id"]
                exams[eid] = Exam(exam_id=eid, name=row.get("exam_name", eid))

    rooms = {}
    if (base_dir / "rooms.csv").exists():
        with open(base_dir / "rooms.csv", "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rid = row["room_id"]
                rooms[rid] = Room(room_id=rid, name=row.get("room_name", rid), capacity=int(row.get("capacity", 50)))

    periods = {}
    if (base_dir / "time_slots.csv").exists():
        with open(base_dir / "time_slots.csv", "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                pid = row["slot_id"]
                periods[pid] = Period(period_id=pid, date=row.get("slot_name", pid))

    student_enrollments = {}
    exam_students = {eid: set() for eid in exams}
    if (base_dir / "registrations.csv").exists():
        with open(base_dir / "registrations.csv", "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                sid = row["student_id"]
                eid = row["exam_id"]
                student_enrollments.setdefault(sid, set()).add(eid)
                exam_students.setdefault(eid, set()).add(sid)

    for eid, students in exam_students.items():
        if eid in exams:
            exams[eid].enrollment_count = len(students)

    conflict_pairs = set()
    for sid, enrolled in student_enrollments.items():
        elist = sorted(list(enrolled))
        for i in range(len(elist)):
            for j in range(i + 1, len(elist)):
                conflict_pairs.add((elist[i], elist[j]))

    return ExamDataset(
        dataset_id="synthetic_dataset",
        name="Synthetic Dataset — Demonstration University",
        format_type="synthetic",
        exams=exams,
        rooms=rooms,
        periods=periods,
        student_enrollments=student_enrollments,
        exam_students=exam_students,
        conflict_pairs=conflict_pairs,
        files_stored={
            "exams": "exams.csv",
            "registrations": "registrations.csv",
            "rooms": "rooms.csv",
            "time_slots": "time_slots.csv",
            "students": "students.csv",
        },
    )


def get_active_dataset() -> ExamDataset:
    """Retrieve the currently active validated dataset (defaults to synthetic dataset)."""
    global _ACTIVE_DATASET
    if _ACTIVE_DATASET is None:
        try:
            _ACTIVE_DATASET = load_synthetic_exam_dataset()
        except Exception:
            pass
    return _ACTIVE_DATASET


def set_active_dataset(dataset: Optional[ExamDataset]):
    """Set the currently active validated dataset."""
    global _ACTIVE_DATASET
    _ACTIVE_DATASET = dataset


@dataset_bp.route("/upload", methods=["POST"])
def upload_dataset():
    """Upload and validate examination timetabling dataset files.
    
    Expected form-data:
      - exam_file: (optional/required) .exam, .crs, .exm, .csv
      - stu_file:  (optional/required) .stu, .csv
      - room_file: (optional)          .room, .rooms, .slo, .csv, .json
      - dataset_name: (optional) string label for dataset
    """
    data_text = request.form.get("data_text", "").strip()
    exam_file = request.files.get("exam_file") if request.files else None
    stu_file = request.files.get("stu_file") if request.files else None
    room_file = request.files.get("room_file") if request.files else None

    if not request.files and not data_text:
        return jsonify({
            "status": "error",
            "message": "No files provided in upload request.",
            "errors": ["Please select at least an examination (.exam/.crs) or student enrollment (.stu) file, or provide CSV text rows."]
        }), 400

    # Handle direct text input
    if not exam_file and not stu_file and data_text:
        import io
        from werkzeug.datastructures import FileStorage
        exam_file = FileStorage(
            stream=io.BytesIO(data_text.encode("utf-8")),
            filename="simple_registrations.csv",
            content_type="text/csv",
        )

    has_exam = bool(exam_file and exam_file.filename)
    has_stu = bool(stu_file and stu_file.filename)

    if not has_exam and not has_stu:
        return jsonify({
            "status": "error",
            "message": "Missing required examination data.",
            "errors": ["Upload must include either an examination file, student enrollment file, or CSV text rows."]
        }), 400

    dataset_name = request.form.get("dataset_name", "").strip()
    if not dataset_name:
        if has_exam:
            dataset_name = os.path.splitext(exam_file.filename)[0]
        else:
            dataset_name = os.path.splitext(stu_file.filename)[0]

    # 1. Create sandboxed destination directory
    try:
        dataset_id, folder_path = file_service.create_dataset_directory()
    except FileSecurityError as e:
        return jsonify({"status": "error", "message": str(e), "errors": [str(e)]}), 400

    # 2. Save files safely
    saved_paths = {}
    try:
        if has_exam:
            saved_paths["exam"] = file_service.save_file(exam_file, folder_path, "exam")
        if has_stu:
            saved_paths["stu"] = file_service.save_file(stu_file, folder_path, "stu")
        if room_file and room_file.filename:
            saved_paths["room"] = file_service.save_file(room_file, folder_path, "room")
    except FileSecurityError as e:
        # Clean up directory on security/size error
        return jsonify({
            "status": "error",
            "message": f"File validation failed: {str(e)}",
            "errors": [str(e)]
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error saving files: {str(e)}",
            "errors": [str(e)]
        }), 500

    # 3. Parse and validate dataset
    try:
        dataset = parser_service.parse_dataset(
            dataset_id=dataset_id,
            dataset_name=dataset_name,
            exam_filepath=saved_paths.get("exam"),
            stu_filepath=saved_paths.get("stu"),
            room_filepath=saved_paths.get("room"),
        )
    except DatasetValidationError as e:
        return jsonify({
            "status": "error",
            "message": "Dataset structure validation failed.",
            "errors": e.errors,
            "warnings": e.warnings,
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error parsing dataset: {str(e)}",
            "errors": [str(e)],
        }), 500

    # If user specified time slots, set periods
    time_slots_val = request.form.get("time_slots") or request.form.get("available_slots")
    if time_slots_val:
        try:
            num_slots = int(time_slots_val)
            if num_slots > 0:
                from models.dataset import Period
                dataset.periods = {f"Slot_{i}": Period(period_id=f"Slot_{i}") for i in range(1, num_slots + 1)}
        except ValueError:
            pass

    # 4. Compute statistics and persist metadata
    stats = dataset.calculate_statistics()
    set_active_dataset(dataset)

    metadata_path = os.path.join(folder_path, "metadata.json")
    try:
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump({
                "dataset_id": dataset.dataset_id,
                "name": dataset.name,
                "format_type": dataset.format_type,
                "statistics": stats.to_dict(),
                "files_stored": dataset.files_stored,
                "warnings": dataset.warnings,
            }, f, indent=2)
    except Exception:
        pass

    return jsonify({
        "status": "success",
        "message": f"Dataset '{dataset.name}' successfully uploaded and validated.",
        "dataset_id": dataset.dataset_id,
        "name": dataset.name,
        "format_type": dataset.format_type,
        "statistics": stats.to_dict(),
        "files": dataset.files_stored,
        "warnings": dataset.warnings,
    }), 200


@dataset_bp.route("/current", methods=["GET"])
def get_current_dataset():
    """Retrieve statistics and status of the currently active dataset."""
    dataset = get_active_dataset()
    if not dataset:
        return jsonify({
            "status": "empty",
            "message": "No dataset currently loaded.",
            "dataset": None,
        }), 200

    stats = dataset.calculate_statistics()
    return jsonify({
        "status": "success",
        "dataset": {
            "dataset_id": dataset.dataset_id,
            "name": dataset.name,
            "format_type": dataset.format_type,
            "statistics": stats.to_dict(),
            "files": dataset.files_stored,
            "warnings": dataset.warnings,
        }
    }), 200


@dataset_bp.route("/current", methods=["DELETE"])
def delete_current_dataset():
    """Reset active dataset back to the project default synthetic dataset."""
    global _ACTIVE_DATASET
    _ACTIVE_DATASET = load_synthetic_exam_dataset()
    stats = _ACTIVE_DATASET.calculate_statistics()
    return jsonify({
        "status": "success",
        "message": "Active dataset has been reset to the default synthetic dataset.",
        "dataset": {
            "dataset_id": _ACTIVE_DATASET.dataset_id,
            "name": _ACTIVE_DATASET.name,
            "format_type": _ACTIVE_DATASET.format_type,
            "statistics": stats.to_dict(),
            "files": _ACTIVE_DATASET.files_stored,
            "warnings": _ACTIVE_DATASET.warnings,
        }
    }), 200


@dataset_bp.route("/synthetic", methods=["POST", "GET"])
def activate_synthetic_dataset():
    """Explicitly activate the project's 100-student synthetic dataset."""
    global _ACTIVE_DATASET
    _ACTIVE_DATASET = load_synthetic_exam_dataset()
    stats = _ACTIVE_DATASET.calculate_statistics()
    return jsonify({
        "status": "success",
        "message": "Activated project synthetic dataset (100 students, 15 examinations, 300 registrations).",
        "dataset": {
            "dataset_id": _ACTIVE_DATASET.dataset_id,
            "name": _ACTIVE_DATASET.name,
            "format_type": _ACTIVE_DATASET.format_type,
            "statistics": stats.to_dict(),
            "files": _ACTIVE_DATASET.files_stored,
            "warnings": _ACTIVE_DATASET.warnings,
        }
    }), 200
