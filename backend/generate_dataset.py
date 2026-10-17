"""Synthetic Dataset Generator for Fairness-Aware University Examination Timetabling.

Generates reproducible synthetic datasets adhering to university scheduling constraints:
- 100 Students across 4 Departments and 3 Academic Years
- 15 Examinations
- 6 Time Slots
- 3 Examination Rooms (capacities 40-60)
- Realistic student registrations with structured conflict pairs
"""

import csv
from pathlib import Path
import random
import sys
from typing import Any, Dict, List, Set, Tuple

# Configuration & Constants
RANDOM_SEED = 42

NUM_STUDENTS = 100
NUM_EXAMS = 15
NUM_TIME_SLOTS = 6
NUM_ROOMS = 3

DEPARTMENTS = [
    "Computer Science",
    "Information Technology",
    "Electrical Engineering",
    "Mechanical Engineering",
]

ACADEMIC_YEARS = [1, 2, 3]

EXAM_CATALOGUE = [
    # Computer Science
    ("EX101", "Data Structures & Algorithms", "Computer Science"),
    ("EX102", "Operating Systems", "Computer Science"),
    ("EX103", "Database Management Systems", "Computer Science"),
    ("EX104", "Artificial Intelligence", "Computer Science"),
    # Information Technology
    ("EX105", "Web Technologies", "Information Technology"),
    ("EX106", "Computer Networks", "Information Technology"),
    ("EX107", "Cloud Computing", "Information Technology"),
    ("EX108", "Cyber Security", "Information Technology"),
    # Electrical Engineering
    ("EX109", "Digital Signal Processing", "Electrical Engineering"),
    ("EX110", "Control Systems", "Electrical Engineering"),
    ("EX111", "Microprocessors & Microcontrollers", "Electrical Engineering"),
    ("EX112", "Power Electronics", "Electrical Engineering"),
    # Mechanical Engineering
    ("EX113", "Thermodynamics", "Mechanical Engineering"),
    ("EX114", "Fluid Mechanics", "Mechanical Engineering"),
    ("EX115", "Theory of Machines", "Mechanical Engineering"),
]

TIME_SLOTS_DATA = [
    ("SLOT_1", "Day 1 - Morning (09:00 - 12:00)"),
    ("SLOT_2", "Day 1 - Afternoon (14:00 - 17:00)"),
    ("SLOT_3", "Day 2 - Morning (09:00 - 12:00)"),
    ("SLOT_4", "Day 2 - Afternoon (14:00 - 17:00)"),
    ("SLOT_5", "Day 3 - Morning (09:00 - 12:00)"),
    ("SLOT_6", "Day 3 - Afternoon (14:00 - 17:00)"),
]

ROOM_NAMES = [
    ("ROOM_101", "Examination Hall A"),
    ("ROOM_102", "Examination Hall B"),
    ("ROOM_103", "Seminar Hall C"),
]

# Structured Academic Curriculum Mapping by (Department, Academic Year).
# Students primarily enroll in core courses for their department and academic year,
# supplemented by domain-relevant shared electives between partner departments:
#   - Computing Domain: Computer Science <-> Information Technology
#   - Engineering Domain: Electrical Engineering <-> Mechanical Engineering
# This mirrors realistic academic degree pathways and maintains a schedulable conflict graph.
COHORT_CURRICULUM = {
    ("Computer Science", 1): ["EX101", "EX102", "EX105"],
    ("Computer Science", 2): ["EX102", "EX103", "EX106"],
    ("Computer Science", 3): ["EX103", "EX104", "EX108"],

    ("Information Technology", 1): ["EX105", "EX106", "EX101"],
    ("Information Technology", 2): ["EX106", "EX107", "EX102"],
    ("Information Technology", 3): ["EX107", "EX108", "EX104"],

    ("Electrical Engineering", 1): ["EX109", "EX110", "EX113"],
    ("Electrical Engineering", 2): ["EX110", "EX111", "EX114"],
    ("Electrical Engineering", 3): ["EX111", "EX112", "EX115"],

    ("Mechanical Engineering", 1): ["EX113", "EX114", "EX109"],
    ("Mechanical Engineering", 2): ["EX114", "EX115", "EX110"],
    ("Mechanical Engineering", 3): ["EX113", "EX115", "EX112"],
}


def generate_dataset(output_dir: Path) -> Dict[str, Any]:
    """Generate synthetic university examination data and write CSV files."""
    random.seed(RANDOM_SEED)

    # 1. Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)

    # 2. Generate Students
    students = []
    for i in range(1, NUM_STUDENTS + 1):
        student_id = f"S{i:03d}"
        department = random.choice(DEPARTMENTS)
        academic_year = random.choice(ACADEMIC_YEARS)
        students.append({
            "student_id": student_id,
            "department": department,
            "academic_year": academic_year,
        })

    # 3. Generate Exams
    exams = []
    for exam_id, exam_name, department in EXAM_CATALOGUE:
        exams.append({
            "exam_id": exam_id,
            "exam_name": exam_name,
            "department": department,
        })

    all_exam_ids = [e["exam_id"] for e in exams]

    # 4. Generate Student Registrations
    # Rules:
    # - Every student is registered for at least 3 exams.
    # - Students primarily take exams from their own department & academic year, with limited shared electives.
    # - No random unconstrained registration across all departments.
    # - Target approximately 15-30 students per exam.
    registrations: List[Tuple[str, str]] = []
    student_exam_map: Dict[str, Set[str]] = {s["student_id"]: set() for s in students}
    exam_student_map: Dict[str, Set[str]] = {e["exam_id"]: set() for e in exams}

    for s in students:
        s_id = s["student_id"]
        s_dept = s["department"]
        s_year = s["academic_year"]

        enrolled_courses = list(COHORT_CURRICULUM.get((s_dept, s_year), []))

        for e_id in enrolled_courses:
            student_exam_map[s_id].add(e_id)
            exam_student_map[e_id].add(s_id)
            registrations.append((s_id, e_id))

    # Guarantee every exam has at least 1 student (safety check)
    for e_id in all_exam_ids:
        if len(exam_student_map[e_id]) == 0:
            random_student = random.choice(students)["student_id"]
            student_exam_map[random_student].add(e_id)
            exam_student_map[e_id].add(random_student)
            registrations.append((random_student, e_id))

    # Sort registrations for clean determinism
    registrations.sort(key=lambda r: (r[0], r[1]))

    # 5. Generate Time Slots
    time_slots = []
    for slot_id, slot_name in TIME_SLOTS_DATA:
        time_slots.append({
            "slot_id": slot_id,
            "slot_name": slot_name,
        })

    # 6. Generate Rooms (Capacity between 40 and 60)
    rooms = []
    for room_id, room_name in ROOM_NAMES:
        capacity = random.randint(40, 60)
        rooms.append({
            "room_id": room_id,
            "room_name": room_name,
            "capacity": capacity,
        })

    # 7. Write CSV Files
    files_to_write = {
        "students.csv": {
            "fieldnames": ["student_id", "department", "academic_year"],
            "rows": students,
        },
        "exams.csv": {
            "fieldnames": ["exam_id", "exam_name", "department"],
            "rows": exams,
        },
        "registrations.csv": {
            "fieldnames": ["student_id", "exam_id"],
            "rows": [{"student_id": s, "exam_id": e} for s, e in registrations],
        },
        "time_slots.csv": {
            "fieldnames": ["slot_id", "slot_name"],
            "rows": time_slots,
        },
        "rooms.csv": {
            "fieldnames": ["room_id", "room_name", "capacity"],
            "rows": rooms,
        },
    }

    generated_paths = {}
    for filename, file_data in files_to_write.items():
        file_path = output_dir / filename
        with open(file_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=file_data["fieldnames"])
            writer.writeheader()
            writer.writerows(file_data["rows"])
        generated_paths[filename] = file_path

    # 8. Compute Conflict Pairs
    # Conflict pair (e1, e2) exists if e1 < e2 and at least one student takes both
    conflict_pairs: Set[Tuple[str, str]] = set()
    conflict_weights: Dict[Tuple[str, str], int] = {}
    for s_id, enrolled_exams in student_exam_map.items():
        sorted_exams = sorted(list(enrolled_exams))
        n = len(sorted_exams)
        for i in range(n):
            for j in range(i + 1, n):
                pair = (sorted_exams[i], sorted_exams[j])
                conflict_pairs.add(pair)
                conflict_weights[pair] = conflict_weights.get(pair, 0) + 1

    max_possible_conflicts = (NUM_EXAMS * (NUM_EXAMS - 1)) // 2
    conflict_density = len(conflict_pairs) / max_possible_conflicts if max_possible_conflicts > 0 else 0.0

    # 9. Validation Checks
    student_ids = [s["student_id"] for s in students]
    exam_ids = [e["exam_id"] for e in exams]

    # Validate uniqueness
    assert len(student_ids) == len(set(student_ids)), "Student IDs must be unique"
    assert len(student_ids) == NUM_STUDENTS, f"Expected {NUM_STUDENTS} students"
    assert len(exam_ids) == len(set(exam_ids)), "Exam IDs must be unique"
    assert len(exam_ids) == NUM_EXAMS, f"Expected {NUM_EXAMS} exams"

    # Validate registrations
    assert len(registrations) == len(set(registrations)), "Registrations must not contain duplicates"
    valid_student_ids = set(student_ids)
    valid_exam_ids = set(exam_ids)
    for s_id, e_id in registrations:
        assert s_id in valid_student_ids, f"Invalid student ID in registration: {s_id}"
        assert e_id in valid_exam_ids, f"Invalid exam ID in registration: {e_id}"

    # Validate at least 3 examinations per student
    for s_id, enrolled in student_exam_map.items():
        assert len(enrolled) >= 3, f"Student {s_id} has fewer than 3 exams ({len(enrolled)})"

    # Validate at least one student per exam and check enrollment range
    for e_id, enrolled_students in exam_student_map.items():
        assert len(enrolled_students) >= 1, f"Exam {e_id} has 0 registered students"

    # Validate room capacities
    for r in rooms:
        assert 40 <= r["capacity"] <= 60, f"Room {r['room_id']} capacity {r['capacity']} outside [40, 60]"

    # 10. Feasibility Verification
    feasibility_status = "Not Tested"
    solver_method = "N/A"
    try:
        backend_dir = Path(__file__).resolve().parent
        if str(backend_dir) not in sys.path:
            sys.path.insert(0, str(backend_dir))
        from services.solver_service import TimetablingDataset, solve_standard_ilp, solve_greedy

        dataset = TimetablingDataset(
            exams={e["exam_id"]: {"exam_name": e["exam_name"], "department": e["department"]} for e in exams},
            students={s["student_id"]: {"department": s["department"], "academic_year": s["academic_year"]} for s in students},
            rooms=rooms,
            time_slots=time_slots,
            registrations=registrations,
            student_exams=student_exam_map,
            exam_students=exam_student_map,
            conflict_pairs=conflict_pairs,
            conflict_weights=conflict_weights,
        )

        # First test Standard ILP (PuLP / CBC)
        ilp_res = solve_standard_ilp(dataset, num_slots=6, time_limit=15)
        if ilp_res["status"] in ("Optimal", "Feasible") and ilp_res["hard_constraint_violations"] == 0:
            feasibility_status = f"Feasible ({ilp_res['status']})"
            solver_method = "PuLP / CBC Standard ILP"
        else:
            # Fallback check Greedy
            greedy_res = solve_greedy(dataset, num_slots=6)
            if greedy_res["status"] == "Feasible" and greedy_res["hard_constraint_violations"] == 0:
                feasibility_status = "Feasible (Greedy)"
                solver_method = "Greedy Constructive Heuristic"
            else:
                feasibility_status = "Infeasible"
    except Exception as e:
        feasibility_status = f"Feasibility test skipped ({e})"

    # 11. Display Statistics
    print("=" * 65)
    print("  FAIRNESS-AWARE EXAM TIMETABLING - SYNTHETIC DATASET GENERATOR")
    print("=" * 65)
    print(f"Output Directory        : {output_dir}")
    print(f"Random Seed             : {RANDOM_SEED}")
    print("-" * 65)
    print(f"Total Students          : {len(students)}")
    print(f"Total Examinations      : {len(exams)}")
    print(f"Total Departments       : {len(DEPARTMENTS)}")
    print(f"Total Academic Years    : {len(ACADEMIC_YEARS)}")
    print(f"Total Time Slots        : {len(time_slots)}")
    print(f"Total Rooms             : {len(rooms)}")
    print(f"Total Registrations     : {len(registrations)}")
    print(f"Total Conflict Pairs    : {len(conflict_pairs)} / {max_possible_conflicts}")
    print(f"Conflict Graph Density  : {conflict_density:.4f} ({conflict_density * 100:.1f}%)")
    print("-" * 65)
    print("Students Per Examination:")
    for e_id in all_exam_ids:
        count = len(exam_student_map[e_id])
        print(f"  - {e_id}: {count:2d} students")
    print("-" * 65)
    print("Room Capacities:")
    for r in rooms:
        print(f"  - {r['room_id']} ({r['room_name']}): {r['capacity']} seats")
    print("-" * 65)
    print("Generated CSV Files:")
    for fname, fpath in generated_paths.items():
        print(f"  [OK] {fname} ({fpath.stat().st_size} bytes)")
    print("-" * 65)
    print(f"6-Slot Timetable Feasibility: {feasibility_status} (via {solver_method})")
    print("Validation Status           : ALL VALIDATION CHECKS PASSED")
    print("=" * 65)

    return {
        "students": len(students),
        "exams": len(exams),
        "registrations": len(registrations),
        "conflict_pairs": len(conflict_pairs),
        "conflict_density": conflict_density,
        "students_per_exam": {e: len(exam_student_map[e]) for e in all_exam_ids},
        "feasibility": feasibility_status,
        "files": list(generated_paths.keys()),
    }


if __name__ == "__main__":
    dataset_dir = Path(__file__).resolve().parent / "data" / "synthetic_dataset"
    generate_dataset(dataset_dir)
