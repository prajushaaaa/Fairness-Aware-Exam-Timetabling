"""Operations Research Scheduling Engine for University Examination Timetabling.

Implements three distinct timetabling methodologies:
1. Greedy Constructive Heuristic (Largest-Degree-First Graph Coloring)
2. Standard Integer Linear Programming (PuLP / CBC minimizing cumulative proximity penalty)
3. Fairness-Aware Integer Linear Programming (PuLP / CBC Min-Max peak burden reduction)
"""

import csv
from dataclasses import dataclass, field
from pathlib import Path
import time
from typing import Any, Dict, List, Optional, Set, Tuple

# PuLP compatibility across version 2.x and 4.x
try:
    import pulp
    PULP_AVAILABLE = True
except ImportError:
    PULP_AVAILABLE = False


@dataclass
class TimetablingDataset:
    """In-memory representation of exam timetabling instance."""
    exams: Dict[str, Dict[str, Any]]  # exam_id -> {name, department}
    students: Dict[str, Dict[str, Any]]  # student_id -> {department, academic_year}
    rooms: List[Dict[str, Any]]  # [{room_id, room_name, capacity}]
    time_slots: List[Dict[str, Any]]  # [{slot_id, slot_name}]
    registrations: List[Tuple[str, str]]  # [(student_id, exam_id)]
    student_exams: Dict[str, Set[str]]  # student_id -> set of exam_ids
    exam_students: Dict[str, Set[str]]  # exam_id -> set of student_ids
    conflict_pairs: Set[Tuple[str, str]]  # set of (e1, e2) with e1 < e2 sharing >= 1 student
    conflict_weights: Dict[Tuple[str, str], int]  # (e1, e2) -> number of shared students


def load_synthetic_dataset(base_dir: Optional[Path] = None) -> TimetablingDataset:
    """Load the synthetic university examination dataset from CSV files.
    
    Dynamically computes conflict graph and pairwise clash weights from actual registrations.
    """
    if base_dir is None:
        base_dir = Path(__file__).resolve().parent.parent / "data" / "synthetic_dataset"

    if not base_dir.exists():
        raise FileNotFoundError(f"Synthetic dataset directory not found at: {base_dir}")

    # 1. Load students
    students: Dict[str, Dict[str, Any]] = {}
    students_file = base_dir / "students.csv"
    if students_file.exists():
        with open(students_file, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                students[row["student_id"]] = {
                    "department": row.get("department", ""),
                    "academic_year": row.get("academic_year", ""),
                }

    # 2. Load exams
    exams: Dict[str, Dict[str, Any]] = {}
    exams_file = base_dir / "exams.csv"
    if exams_file.exists():
        with open(exams_file, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                exams[row["exam_id"]] = {
                    "exam_name": row.get("exam_name", row["exam_id"]),
                    "department": row.get("department", ""),
                }

    # 3. Load time slots
    time_slots: List[Dict[str, Any]] = []
    slots_file = base_dir / "time_slots.csv"
    if slots_file.exists():
        with open(slots_file, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                time_slots.append({
                    "slot_id": row["slot_id"],
                    "slot_name": row.get("slot_name", row["slot_id"]),
                })

    # 4. Load rooms
    rooms: List[Dict[str, Any]] = []
    rooms_file = base_dir / "rooms.csv"
    if rooms_file.exists():
        with open(rooms_file, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rooms.append({
                    "room_id": row["room_id"],
                    "room_name": row.get("room_name", row["room_id"]),
                    "capacity": int(row.get("capacity", 50)),
                })

    # 5. Load registrations
    registrations: List[Tuple[str, str]] = []
    student_exams: Dict[str, Set[str]] = {s_id: set() for s_id in students}
    exam_students: Dict[str, Set[str]] = {e_id: set() for e_id in exams}

    regs_file = base_dir / "registrations.csv"
    if regs_file.exists():
        with open(regs_file, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                s_id = row["student_id"]
                e_id = row["exam_id"]
                registrations.append((s_id, e_id))
                student_exams.setdefault(s_id, set()).add(e_id)
                exam_students.setdefault(e_id, set()).add(s_id)

    # 6. Build Conflict Graph dynamically from registrations
    conflict_pairs: Set[Tuple[str, str]] = set()
    conflict_weights: Dict[Tuple[str, str], int] = {}

    for s_id, enrolled in student_exams.items():
        exam_list = sorted(list(enrolled))
        n = len(exam_list)
        for i in range(n):
            for j in range(i + 1, n):
                pair = (exam_list[i], exam_list[j])
                conflict_pairs.add(pair)
                conflict_weights[pair] = conflict_weights.get(pair, 0) + 1

    return TimetablingDataset(
        exams=exams,
        students=students,
        rooms=rooms,
        time_slots=time_slots,
        registrations=registrations,
        student_exams=student_exams,
        exam_students=exam_students,
        conflict_pairs=conflict_pairs,
        conflict_weights=conflict_weights,
    )


def exam_dataset_to_timetabling_dataset(
    exam_ds: Any,
    requested_slots: Optional[int] = None,
) -> TimetablingDataset:
    """Convert an in-memory ExamDataset model into a TimetablingDataset for solvers."""
    exams = {
        e_id: {"exam_name": getattr(exam, "name", None) or e_id, "department": ""}
        for e_id, exam in exam_ds.exams.items()
    }
    students = {
        s_id: {"department": "", "academic_year": ""}
        for s_id in exam_ds.student_enrollments
    }
    if exam_ds.rooms:
        rooms = [
            {
                "room_id": r.room_id,
                "room_name": getattr(r, "name", None) or r.room_id,
                "capacity": int(getattr(r, "capacity", 50)),
            }
            for r in exam_ds.rooms.values()
        ]
    else:
        # Default rooms if dataset does not specify rooms
        rooms = [
            {"room_id": "ROOM_101", "room_name": "Examination Hall A", "capacity": 50},
            {"room_id": "ROOM_102", "room_name": "Examination Hall B", "capacity": 50},
            {"room_id": "ROOM_103", "room_name": "Examination Hall C", "capacity": 50},
        ]

    num_slots = requested_slots or (len(exam_ds.periods) if exam_ds.periods else 6)
    if exam_ds.periods and requested_slots is None:
        time_slots = [
            {"slot_id": p.period_id, "slot_name": getattr(p, "date", None) or p.period_id}
            for p in exam_ds.periods.values()
        ]
    else:
        time_slots = [
            {"slot_id": f"SLOT_{i+1}", "slot_name": f"Time Slot {i+1}"}
            for i in range(num_slots)
        ]

    registrations = [
        (s, e) for s, elist in exam_ds.student_enrollments.items() for e in elist
    ]
    student_exams = {s: set(elist) for s, elist in exam_ds.student_enrollments.items()}
    exam_students = {e: set(slist) for e, slist in exam_ds.exam_students.items()}

    conflict_pairs = set()
    conflict_weights = {}
    for s_id, enrolled in student_exams.items():
        exam_list = sorted(list(enrolled))
        n = len(exam_list)
        for i in range(n):
            for j in range(i + 1, n):
                pair = (exam_list[i], exam_list[j])
                conflict_pairs.add(pair)
                conflict_weights[pair] = conflict_weights.get(pair, 0) + 1

    return TimetablingDataset(
        exams=exams,
        students=students,
        rooms=rooms,
        time_slots=time_slots,
        registrations=registrations,
        student_exams=student_exams,
        exam_students=exam_students,
        conflict_pairs=conflict_pairs,
        conflict_weights=conflict_weights,
    )


def assign_rooms_for_slot(
    slot_exams: List[str],
    rooms: List[Dict[str, Any]],
    exam_students: Dict[str, Set[str]],
) -> Optional[Dict[str, Dict[str, Any]]]:
    """Greedy first-fit decreasing room assignment for examinations scheduled in a slot.
    
    Returns exam_id -> room dict if feasible, else None.
    """
    if len(slot_exams) > len(rooms):
        return None

    # Sort exams by student count descending
    sorted_exams = sorted(
        slot_exams, key=lambda e: len(exam_students.get(e, set())), reverse=True
    )
    # Sort rooms by capacity descending
    available_rooms = sorted(rooms, key=lambda r: r["capacity"], reverse=True)

    room_assignment = {}
    used_room_ids = set()

    for e_id in sorted_exams:
        count = len(exam_students.get(e_id, set()))
        assigned_room = None
        for r in available_rooms:
            if r["room_id"] not in used_room_ids and r["capacity"] >= count:
                assigned_room = r
                break

        if assigned_room is None:
            return None  # Cannot fit in any available room

        used_room_ids.add(assigned_room["room_id"])
        room_assignment[e_id] = assigned_room

    return room_assignment


def validate_and_evaluate(
    schedule: List[Dict[str, Any]],
    dataset: TimetablingDataset,
    total_slots_count: int,
) -> Dict[str, Any]:
    """Validate timetable hard constraints and compute soft fairness metrics.
    
    Hard Constraints Checked:
    1. Every examination is scheduled exactly once.
    2. No conflicting exams share a time slot.
    3. Assigned time slots are within bounds.
    4. Room capacities are respected and no two exams share a room simultaneously.
    
    Soft Metrics Evaluated:
    - Conventional Penalty: Student-weighted count of consecutive examination pairs.
    - Maximum Student Burden: Peak count of consecutive exams borne by any single student.
    - Average Student Burden: Mean consecutive exams per enrolled student.
    """
    violations = []
    scheduled_exams = [item["exam_id"] for item in schedule]

    # 1. Exam coverage check
    if len(scheduled_exams) != len(dataset.exams):
        violations.append(
            f"Scheduled {len(scheduled_exams)} exams, but dataset contains {len(dataset.exams)}."
        )

    duplicates = [e for e in set(scheduled_exams) if scheduled_exams.count(e) > 1]
    if duplicates:
        violations.append(f"Duplicate exam scheduling detected: {duplicates}")

    missing = [e for e in dataset.exams if e not in scheduled_exams]
    if missing:
        violations.append(f"Unscheduled exams detected: {missing}")

    # 2. Slot clashes and room overlap check
    slot_assignments: Dict[int, List[str]] = {}
    exam_slot_index: Dict[str, int] = {}
    slot_room_usage: Dict[Tuple[int, str], str] = {}

    for item in schedule:
        e_id = item["exam_id"]
        t_idx = item.get("slot_index")
        r_id = item.get("room_id")

        if t_idx is None or not (0 <= t_idx < total_slots_count):
            violations.append(f"Exam '{e_id}' assigned to invalid slot index: {t_idx}")
            continue

        exam_slot_index[e_id] = t_idx
        slot_assignments.setdefault(t_idx, []).append(e_id)

        # Check room assignment
        if r_id:
            room_info = next((r for r in dataset.rooms if r["room_id"] == r_id), None)
            if not room_info:
                violations.append(f"Exam '{e_id}' assigned to unknown room '{r_id}'.")
            else:
                student_count = len(dataset.exam_students.get(e_id, set()))
                if room_info["capacity"] < student_count:
                    violations.append(
                        f"Room '{r_id}' capacity ({room_info['capacity']}) exceeded by exam '{e_id}' ({student_count} students)."
                    )

            key = (t_idx, r_id)
            if key in slot_room_usage:
                violations.append(
                    f"Room '{r_id}' double-booked at slot {t_idx} by exams '{slot_room_usage[key]}' and '{e_id}'."
                )
            else:
                slot_room_usage[key] = e_id

    # Check pairwise conflicts sharing slot
    for t_idx, exams_in_slot in slot_assignments.items():
        n = len(exams_in_slot)
        for i in range(n):
            for j in range(i + 1, n):
                pair = tuple(sorted([exams_in_slot[i], exams_in_slot[j]]))
                if pair in dataset.conflict_pairs:
                    violations.append(
                        f"Conflict violation: '{pair[0]}' and '{pair[1]}' share slot {t_idx} with {dataset.conflict_weights.get(pair, 1)} common students."
                    )

    # 3. Soft Fairness Metrics Calculation
    # Conventional proximity penalty: sum of consecutive exam pairs weighted by students
    conventional_penalty = 0.0
    for pair, weight in dataset.conflict_weights.items():
        e1, e2 = pair
        if e1 in exam_slot_index and e2 in exam_slot_index:
            t1 = exam_slot_index[e1]
            t2 = exam_slot_index[e2]
            if abs(t1 - t2) == 1:
                conventional_penalty += weight

    # Student Burden: number of consecutive exams each student experiences
    student_burdens = {}
    for s_id, enrolled in dataset.student_exams.items():
        slots_for_student = sorted([exam_slot_index[e] for e in enrolled if e in exam_slot_index])
        consecutive_count = 0
        for i in range(len(slots_for_student) - 1):
            if slots_for_student[i + 1] - slots_for_student[i] == 1:
                consecutive_count += 1
        student_burdens[s_id] = consecutive_count

    max_burden = max(student_burdens.values()) if student_burdens else 0
    avg_burden = (
        sum(student_burdens.values()) / len(student_burdens) if student_burdens else 0.0
    )

    return {
        "is_valid": len(violations) == 0,
        "hard_constraint_violations": len(violations),
        "violations": violations,
        "conventional_penalty": round(conventional_penalty, 2),
        "maximum_student_burden": max_burden,
        "average_student_burden": round(avg_burden, 3),
    }


def solve_greedy(
    dataset: TimetablingDataset,
    num_slots: Optional[int] = None,
) -> Dict[str, Any]:
    """Execute Largest-Degree-First Graph Coloring Constructive Heuristic.
    
    1. Sorts examinations descending by conflict degree.
    2. Sequentially assigns each examination to the lowest-index clash-free time slot.
    3. Allocates clash-free examinations to compliant examination rooms.
    4. Reports infeasibility if the given number of slots is insufficient.
    """
    start_time = time.perf_counter()
    slots = dataset.time_slots if num_slots is None else [
        {"slot_id": f"SLOT_{i+1}", "slot_name": f"Time Slot {i+1}"} for i in range(num_slots)
    ]
    num_available_slots = len(slots)

    # 1. Compute conflict degree for each exam
    exam_conflict_degree: Dict[str, int] = {e: 0 for e in dataset.exams}
    for e1, e2 in dataset.conflict_pairs:
        if e1 in exam_conflict_degree:
            exam_conflict_degree[e1] += 1
        if e2 in exam_conflict_degree:
            exam_conflict_degree[e2] += 1

    # Sort exams by conflict degree descending (break ties by enrollment size, then ID)
    sorted_exams = sorted(
        dataset.exams.keys(),
        key=lambda e: (
            exam_conflict_degree[e],
            len(dataset.exam_students.get(e, set())),
            e,
        ),
        reverse=True,
    )

    slot_assignments: Dict[int, List[str]] = {t: [] for t in range(num_available_slots)}
    exam_assigned_slot: Dict[str, int] = {}

    for e_id in sorted_exams:
        assigned = False
        # Try slots in order
        for t in range(num_available_slots):
            # Check clash with already placed exams in slot t
            has_clash = any(
                tuple(sorted([e_id, placed])) in dataset.conflict_pairs
                for placed in slot_assignments[t]
            )
            if not has_clash and len(slot_assignments[t]) < len(dataset.rooms):
                # Verify that room capacity can accommodate this exam along with existing ones
                candidate_slot_exams = slot_assignments[t] + [e_id]
                room_check = assign_rooms_for_slot(
                    candidate_slot_exams, dataset.rooms, dataset.exam_students
                )
                if room_check is not None:
                    slot_assignments[t].append(e_id)
                    exam_assigned_slot[e_id] = t
                    assigned = True
                    break

        if not assigned:
            elapsed = round(time.perf_counter() - start_time, 4)
            return {
                "method": "greedy",
                "status": "Infeasible",
                "schedule": [],
                "runtime": elapsed,
                "hard_constraint_violations": 1,
                "conventional_penalty": 0.0,
                "maximum_student_burden": 0,
                "average_student_burden": 0.0,
                "error": (
                    f"Greedy heuristic could not find a conflict-free time slot and room "
                    f"for examination '{e_id}' within {num_available_slots} available slots."
                ),
            }

    # 2. Build final schedule with room allocations
    final_schedule = []
    for t in range(num_available_slots):
        exams_in_slot = slot_assignments[t]
        room_alloc = assign_rooms_for_slot(
            exams_in_slot, dataset.rooms, dataset.exam_students
        ) or {}

        for e_id in exams_in_slot:
            exam_meta = dataset.exams.get(e_id, {})
            room_meta = room_alloc.get(e_id, {})
            enrolled = sorted(list(dataset.exam_students.get(e_id, set())))

            final_schedule.append({
                "exam_id": e_id,
                "exam_name": exam_meta.get("exam_name", e_id),
                "slot_index": t,
                "time_slot": slots[t]["slot_id"],
                "time_slot_name": slots[t]["slot_name"],
                "room_id": room_meta.get("room_id", "N/A"),
                "room_name": room_meta.get("room_name", "N/A"),
                "student_count": len(enrolled),
                "students": ", ".join(enrolled[:10]) + ("..." if len(enrolled) > 10 else ""),
            })

    elapsed = round(time.perf_counter() - start_time, 4)
    evaluation = validate_and_evaluate(final_schedule, dataset, num_available_slots)

    status = "Feasible" if evaluation["is_valid"] else "Infeasible"
    return {
        "method": "greedy",
        "status": status,
        "schedule": final_schedule,
        "runtime": elapsed,
        "hard_constraint_violations": evaluation["hard_constraint_violations"],
        "conventional_penalty": evaluation["conventional_penalty"],
        "maximum_student_burden": evaluation["maximum_student_burden"],
        "average_student_burden": evaluation["average_student_burden"],
        "error": None if evaluation["is_valid"] else "; ".join(evaluation["violations"][:3]),
    }


def _create_pulp_variable(prob, name: str, lowBound=0, upBound=1, cat="Binary"):
    """Helper for cross-version PuLP variable creation (v2.x and v4.x)."""
    if hasattr(prob, "add_variable"):
        return prob.add_variable(name, lowBound=lowBound, upBound=upBound, cat=cat)
    else:
        lp_cat = (
            pulp.LpBinary
            if cat == "Binary"
            else (pulp.LpInteger if cat == "Integer" else pulp.LpContinuous)
        )
        return pulp.LpVariable(name, lowBound=lowBound, upBound=upBound, cat=lp_cat)


def solve_standard_ilp(
    dataset: TimetablingDataset,
    num_slots: Optional[int] = None,
    time_limit: int = 20,
) -> Dict[str, Any]:
    """Solve examination timetabling using Standard Integer Linear Programming (PuLP).
    
    Hard Constraints:
    1. Each examination is assigned to exactly one time slot: sum_t x[e,t] = 1
    2. Conflicting examinations cannot share a time slot: x[e1,t] + x[e2,t] <= 1
    3. Room capacity limit: sum_e x[e,t] <= |Rooms|
    
    Objective:
    Minimize cumulative student proximity penalty (consecutive exam pairs).
    """
    if not PULP_AVAILABLE:
        return {
            "method": "standard_ilp",
            "status": "Error",
            "schedule": [],
            "runtime": 0.0,
            "hard_constraint_violations": 0,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": "PuLP package is not available in the Python environment.",
        }

    start_time = time.perf_counter()
    slots = dataset.time_slots if num_slots is None else [
        {"slot_id": f"SLOT_{i+1}", "slot_name": f"Time Slot {i+1}"} for i in range(num_slots)
    ]
    num_available_slots = len(slots)
    T = list(range(num_available_slots))
    exams_list = sorted(list(dataset.exams.keys()))

    prob = pulp.LpProblem("Standard_Exam_Timetabling", pulp.LpMinimize)

    # Decision variables x[e, t] \in {0, 1}
    x: Dict[Tuple[str, int], Any] = {}
    for e in exams_list:
        for t in T:
            x[(e, t)] = _create_pulp_variable(prob, f"x_{e}_{t}", lowBound=0, upBound=1, cat="Binary")

    # Hard Constraint 1: Exactly one time slot per exam
    for e in exams_list:
        prob += pulp.lpSum(x[(e, t)] for t in T) == 1, f"OneSlot_{e}"

    # Hard Constraint 2: No clashing examinations in the same slot
    for e1, e2 in dataset.conflict_pairs:
        for t in T:
            prob += x[(e1, t)] + x[(e2, t)] <= 1, f"NoClash_{e1}_{e2}_{t}"

    # Hard Constraint 3: At most |Rooms| examinations simultaneously per slot
    max_rooms = len(dataset.rooms)
    for t in T:
        prob += pulp.lpSum(x[(e, t)] for e in exams_list) <= max_rooms, f"MaxRooms_{t}"

    # Linearization for consecutive exam pairs: y[e1, e2, t] \in [0, 1]
    y: Dict[Tuple[str, str, int], Any] = {}
    for e1, e2 in dataset.conflict_pairs:
        for t in range(num_available_slots - 1):
            y_var = _create_pulp_variable(prob, f"y_{e1}_{e2}_{t}", lowBound=0, upBound=1, cat="Continuous")
            y[(e1, e2, t)] = y_var
            prob += y_var >= x[(e1, t)] + x[(e2, t + 1)] - 1
            prob += y_var >= x[(e2, t)] + x[(e1, t + 1)] - 1

    # Objective: Minimize total student-weighted consecutive pairs
    conventional_penalty_expr = pulp.lpSum(
        dataset.conflict_weights[pair] * y[(pair[0], pair[1], t)]
        for pair in dataset.conflict_pairs
        for t in range(num_available_slots - 1)
    )
    prob += conventional_penalty_expr

    # Solve with time limit
    solver = None
    try:
        if hasattr(pulp, "getSolver"):
            solver = pulp.getSolver("COIN_CMD", msg=False, timeLimit=time_limit)
        elif hasattr(pulp, "PULP_CBC_CMD"):
            solver = pulp.PULP_CBC_CMD(msg=False, timeLimit=time_limit)
    except Exception:
        pass

    try:
        res = prob.solve(solver)
    except Exception as e:
        elapsed = round(time.perf_counter() - start_time, 4)
        return {
            "method": "standard_ilp",
            "status": "Error",
            "schedule": [],
            "runtime": elapsed,
            "hard_constraint_violations": 0,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"Solver error: {str(e)}",
        }

    elapsed = round(time.perf_counter() - start_time, 4)

    # Determine status string
    status_str = "Unknown"
    has_solution = False
    if hasattr(res, "status_str"):
        status_str = res.status_str
        has_solution = getattr(res, "has_solution", False) or status_str in ("Optimal", "TimeLimit", "GapLimit")
    elif hasattr(prob, "status") and hasattr(pulp, "LpStatus"):
        status_str = pulp.LpStatus.get(prob.status, "Unknown")
        has_solution = status_str in ("Optimal", "Not Solved") and any(
            (v.varValue or 0) > 0.5 for v in x.values()
        )

    if status_str == "Infeasible":
        return {
            "method": "standard_ilp",
            "status": "Infeasible",
            "schedule": [],
            "runtime": elapsed,
            "hard_constraint_violations": 1,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"The solver proved the timetabling model is Infeasible for {num_available_slots} time slots.",
        }

    # Extract solution if available
    slot_assignments: Dict[int, List[str]] = {t: [] for t in T}
    assigned_count = 0
    for e in exams_list:
        for t in T:
            val = x[(e, t)].value() if hasattr(x[(e, t)], "value") else x[(e, t)].varValue
            if val is not None and round(val) == 1:
                slot_assignments[t].append(e)
                assigned_count += 1
                break

    if assigned_count < len(exams_list):
        return {
            "method": "standard_ilp",
            "status": status_str if status_str != "Optimal" else "Infeasible",
            "schedule": [],
            "runtime": elapsed,
            "hard_constraint_violations": len(exams_list) - assigned_count,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"Solver produced incomplete timetable ({assigned_count}/{len(exams_list)} exams). Status: {status_str}",
        }

    # Room Allocation
    final_schedule = []
    for t in T:
        exams_in_slot = slot_assignments[t]
        room_alloc = assign_rooms_for_slot(exams_in_slot, dataset.rooms, dataset.exam_students) or {}
        for e_id in exams_in_slot:
            exam_meta = dataset.exams.get(e_id, {})
            room_meta = room_alloc.get(e_id, {})
            enrolled = sorted(list(dataset.exam_students.get(e_id, set())))

            final_schedule.append({
                "exam_id": e_id,
                "exam_name": exam_meta.get("exam_name", e_id),
                "slot_index": t,
                "time_slot": slots[t]["slot_id"],
                "time_slot_name": slots[t]["slot_name"],
                "room_id": room_meta.get("room_id", "N/A"),
                "room_name": room_meta.get("room_name", "N/A"),
                "student_count": len(enrolled),
                "students": ", ".join(enrolled[:10]) + ("..." if len(enrolled) > 10 else ""),
            })

    evaluation = validate_and_evaluate(final_schedule, dataset, num_available_slots)
    confirmed_status = "Optimal" if (status_str == "Optimal" and evaluation["is_valid"]) else ("Feasible" if evaluation["is_valid"] else "Infeasible")

    return {
        "method": "standard_ilp",
        "status": confirmed_status,
        "schedule": final_schedule,
        "runtime": elapsed,
        "hard_constraint_violations": evaluation["hard_constraint_violations"],
        "conventional_penalty": evaluation["conventional_penalty"],
        "maximum_student_burden": evaluation["maximum_student_burden"],
        "average_student_burden": evaluation["average_student_burden"],
        "error": None if evaluation["is_valid"] else "; ".join(evaluation["violations"][:3]),
    }


def solve_fairness_ilp(
    dataset: TimetablingDataset,
    fairness_weight: float = 0.5,
    num_slots: Optional[int] = None,
    time_limit: int = 20,
) -> Dict[str, Any]:
    """Solve examination timetabling using Fairness-Aware Integer Linear Programming (PuLP).
    
    Hard Constraints:
    - Same as Standard ILP (exact slot allocation, clash prevention, room count limit).
    
    Fairness Objective Formulation:
    - Define individual student burden B_s = sum of consecutive exam pairs for student s.
    - Introduce continuous variable M >= B_s for all s in Students (bounding peak burden).
    - Multi-objective function:
        Minimize (1 - lambda) * (Total Conventional Penalty) + lambda * (|Students| * M)
    """
    if not PULP_AVAILABLE:
        return {
            "method": "fairness_ilp",
            "status": "Error",
            "schedule": [],
            "runtime": 0.0,
            "hard_constraint_violations": 0,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": "PuLP package is not available in the Python environment.",
        }

    start_time = time.perf_counter()
    lam = max(0.0, min(1.0, float(fairness_weight)))
    slots = dataset.time_slots if num_slots is None else [
        {"slot_id": f"SLOT_{i+1}", "slot_name": f"Time Slot {i+1}"} for i in range(num_slots)
    ]
    num_available_slots = len(slots)
    T = list(range(num_available_slots))
    exams_list = sorted(list(dataset.exams.keys()))

    prob = pulp.LpProblem("Fairness_Aware_Timetabling", pulp.LpMinimize)

    # Decision variables x[e, t] \in {0, 1}
    x: Dict[Tuple[str, int], Any] = {}
    for e in exams_list:
        for t in T:
            x[(e, t)] = _create_pulp_variable(prob, f"x_{e}_{t}", lowBound=0, upBound=1, cat="Binary")

    # Hard Constraint 1: Exactly one time slot per exam
    for e in exams_list:
        prob += pulp.lpSum(x[(e, t)] for t in T) == 1, f"OneSlot_{e}"

    # Hard Constraint 2: No clashing examinations in the same slot
    for e1, e2 in dataset.conflict_pairs:
        for t in T:
            prob += x[(e1, t)] + x[(e2, t)] <= 1, f"NoClash_{e1}_{e2}_{t}"

    # Hard Constraint 3: Room capacity slot limit
    max_rooms = len(dataset.rooms)
    for t in T:
        prob += pulp.lpSum(x[(e, t)] for e in exams_list) <= max_rooms, f"MaxRooms_{t}"

    # Linearization for consecutive exam pairs
    y: Dict[Tuple[str, str, int], Any] = {}
    for e1, e2 in dataset.conflict_pairs:
        for t in range(num_available_slots - 1):
            y_var = _create_pulp_variable(prob, f"y_{e1}_{e2}_{t}", lowBound=0, upBound=1, cat="Continuous")
            y[(e1, e2, t)] = y_var
            prob += y_var >= x[(e1, t)] + x[(e2, t + 1)] - 1
            prob += y_var >= x[(e2, t)] + x[(e1, t + 1)] - 1

    # Total conventional proximity penalty
    conventional_penalty_expr = pulp.lpSum(
        dataset.conflict_weights[pair] * y[(pair[0], pair[1], t)]
        for pair in dataset.conflict_pairs
        for t in range(num_available_slots - 1)
    )

    # Fairness Variable M: Upper bound on individual student fatigue (Min-Max)
    M = _create_pulp_variable(prob, "Max_Student_Burden", lowBound=0, cat="Continuous")

    for s_id, enrolled in dataset.student_exams.items():
        exam_list = sorted(list(enrolled))
        s_pairs = []
        for i in range(len(exam_list)):
            for j in range(i + 1, len(exam_list)):
                s_pairs.append((exam_list[i], exam_list[j]))

        if s_pairs and num_available_slots > 1:
            burden_s = pulp.lpSum(
                y[(p[0], p[1], t)]
                for p in s_pairs
                if (p[0], p[1]) in dataset.conflict_pairs
                for t in range(num_available_slots - 1)
            )
            prob += M >= burden_s, f"BurdenBound_{s_id}"

    # Combined Objective Function
    scale_factor = float(len(dataset.students)) if dataset.students else 100.0
    prob += (1.0 - lam) * conventional_penalty_expr + lam * scale_factor * M

    # Solve
    solver = None
    try:
        if hasattr(pulp, "getSolver"):
            solver = pulp.getSolver("COIN_CMD", msg=False, timeLimit=time_limit)
        elif hasattr(pulp, "PULP_CBC_CMD"):
            solver = pulp.PULP_CBC_CMD(msg=False, timeLimit=time_limit)
    except Exception:
        pass

    try:
        res = prob.solve(solver)
    except Exception as e:
        elapsed = round(time.perf_counter() - start_time, 4)
        return {
            "method": "fairness_ilp",
            "status": "Error",
            "schedule": [],
            "runtime": elapsed,
            "hard_constraint_violations": 0,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"Solver error: {str(e)}",
        }

    elapsed = round(time.perf_counter() - start_time, 4)

    status_str = "Unknown"
    if hasattr(res, "status_str"):
        status_str = res.status_str
    elif hasattr(prob, "status") and hasattr(pulp, "LpStatus"):
        status_str = pulp.LpStatus.get(prob.status, "Unknown")

    if status_str == "Infeasible":
        return {
            "method": "fairness_ilp",
            "status": "Infeasible",
            "schedule": [],
            "runtime": elapsed,
            "hard_constraint_violations": 1,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"The solver proved the fairness timetabling model is Infeasible for {num_available_slots} time slots.",
        }

    # Extract assignment
    slot_assignments: Dict[int, List[str]] = {t: [] for t in T}
    assigned_count = 0
    for e in exams_list:
        for t in T:
            val = x[(e, t)].value() if hasattr(x[(e, t)], "value") else x[(e, t)].varValue
            if val is not None and round(val) == 1:
                slot_assignments[t].append(e)
                assigned_count += 1
                break

    if assigned_count < len(exams_list):
        return {
            "method": "fairness_ilp",
            "status": status_str if status_str != "Optimal" else "Infeasible",
            "schedule": [],
            "runtime": elapsed,
            "hard_constraint_violations": len(exams_list) - assigned_count,
            "conventional_penalty": 0.0,
            "maximum_student_burden": 0,
            "average_student_burden": 0.0,
            "error": f"Solver produced incomplete timetable ({assigned_count}/{len(exams_list)} exams). Status: {status_str}",
        }

    # Room Allocation
    final_schedule = []
    for t in T:
        exams_in_slot = slot_assignments[t]
        room_alloc = assign_rooms_for_slot(exams_in_slot, dataset.rooms, dataset.exam_students) or {}
        for e_id in exams_in_slot:
            exam_meta = dataset.exams.get(e_id, {})
            room_meta = room_alloc.get(e_id, {})
            enrolled = sorted(list(dataset.exam_students.get(e_id, set())))

            final_schedule.append({
                "exam_id": e_id,
                "exam_name": exam_meta.get("exam_name", e_id),
                "slot_index": t,
                "time_slot": slots[t]["slot_id"],
                "time_slot_name": slots[t]["slot_name"],
                "room_id": room_meta.get("room_id", "N/A"),
                "room_name": room_meta.get("room_name", "N/A"),
                "student_count": len(enrolled),
                "students": ", ".join(enrolled[:10]) + ("..." if len(enrolled) > 10 else ""),
            })

    evaluation = validate_and_evaluate(final_schedule, dataset, num_available_slots)
    confirmed_status = "Optimal" if (status_str == "Optimal" and evaluation["is_valid"]) else ("Feasible" if evaluation["is_valid"] else "Infeasible")

    return {
        "method": "fairness_ilp",
        "status": confirmed_status,
        "schedule": final_schedule,
        "runtime": elapsed,
        "hard_constraint_violations": evaluation["hard_constraint_violations"],
        "conventional_penalty": evaluation["conventional_penalty"],
        "maximum_student_burden": evaluation["maximum_student_burden"],
        "average_student_burden": evaluation["average_student_burden"],
        "error": None if evaluation["is_valid"] else "; ".join(evaluation["violations"][:3]),
    }
