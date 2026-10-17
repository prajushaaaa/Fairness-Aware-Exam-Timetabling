"""Dataset parser and validation service for university examination timetabling.

Supports:
1. ITC2007 Examination Timetabling benchmark format (.exam, .stu)
2. Carter / Toronto benchmark format (.crs, .exm, .stu, .slo)
3. CSV schemas for enrollments, rooms, and periods
"""

import csv
import json
import os
import re
from typing import Dict, List, Set, Tuple, Optional
from models.dataset import Exam, Room, Period, ExamDataset, DatasetStatistics


class DatasetValidationError(Exception):
    """Raised when a dataset violates formatting or consistency constraints."""
    def __init__(self, errors: List[str], warnings: Optional[List[str]] = None):
        super().__init__("; ".join(errors))
        self.errors = errors
        self.warnings = warnings or []


class DatasetParserService:
    """Parses and validates exam datasets."""

    def parse_dataset(
        self,
        dataset_id: str,
        dataset_name: str,
        exam_filepath: Optional[str] = None,
        stu_filepath: Optional[str] = None,
        room_filepath: Optional[str] = None,
    ) -> ExamDataset:
        """Parse uploaded files and return a validated ExamDataset instance."""
        errors: List[str] = []
        warnings: List[str] = []

        if not exam_filepath and not stu_filepath:
            raise DatasetValidationError(["At least an examination file or student enrollment file must be provided."])

        dataset = ExamDataset(
            dataset_id=dataset_id,
            name=dataset_name,
            format_type="custom",
        )

        # 1. Parse examination file if provided
        if exam_filepath and os.path.exists(exam_filepath):
            dataset.files_stored["exam_file"] = os.path.basename(exam_filepath)
            self._parse_exam_file(exam_filepath, dataset, errors, warnings)

        # 2. Parse student enrollment file if provided
        if stu_filepath and os.path.exists(stu_filepath):
            dataset.files_stored["stu_file"] = os.path.basename(stu_filepath)
            self._parse_student_file(stu_filepath, dataset, errors, warnings)

        # 3. Parse room file if provided
        if room_filepath and os.path.exists(room_filepath):
            dataset.files_stored["room_file"] = os.path.basename(room_filepath)
            self._parse_room_file(room_filepath, dataset, errors, warnings)

        # 4. Consistency and structural validation
        self._validate_and_finalize_dataset(dataset, errors, warnings)

        if errors:
            raise DatasetValidationError(errors=errors, warnings=warnings)

        dataset.warnings = warnings
        return dataset

    def _parse_exam_file(
        self, filepath: str, dataset: ExamDataset, errors: List[str], warnings: List[str]
    ):
        """Parse an examination file (.exam, .crs, .exm, .csv)."""
        filename = os.path.basename(filepath).lower()

        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()
        except Exception as e:
            errors.append(f"Cannot read examination file: {str(e)}")
            return

        if not content:
            errors.append(f"Examination file '{filename}' is empty.")
            return

        lines = [line.strip() for line in content.splitlines() if line.strip()]

        # Check for ITC2007 section-based format: e.g. [Exams: 10] or [Exams]
        has_itc_sections = any(line.startswith("[") and "]" in line for line in lines)
        if has_itc_sections or filename.endswith(".exam"):
            dataset.format_type = "itc2007"
            self._parse_itc2007_sections(lines, dataset, errors, warnings)
        elif filename.endswith(".csv"):
            dataset.format_type = "csv"
            self._parse_exam_csv(lines, dataset, errors, warnings)
        else:
            # Carter benchmark or plain space/tab separated exam list
            dataset.format_type = "carter"
            self._parse_carter_exam_lines(lines, dataset, errors, warnings)

    def _parse_itc2007_sections(
        self, lines: List[str], dataset: ExamDataset, errors: List[str], warnings: List[str]
    ):
        """Parse ITC2007 format with bracketed sections ([Exams], [Periods], [Rooms], etc.)."""
        current_section = None
        current_student_id = 0

        for line_num, line in enumerate(lines, 1):
            # Check for section header: [Section: Count] or [Section]
            if line.startswith("[") and "]" in line:
                section_header = line[1:line.find("]")].strip().lower()
                current_section = section_header.split(":")[0].strip()
                continue

            if not current_section:
                continue

            # Parse according to active section
            if current_section == "exams":
                # Line format: <exam_id> <duration>
                parts = line.split()
                if not parts:
                    continue
                exam_id = parts[0]
                duration = 180
                if len(parts) >= 2:
                    try:
                        duration = int(parts[1])
                    except ValueError:
                        warnings.append(f"Line {line_num}: Invalid duration '{parts[1]}' for exam {exam_id}. Using 180 min.")

                dataset.exams[exam_id] = Exam(exam_id=exam_id, duration=duration)

            elif current_section == "periods":
                # Line format: <period_id>, <date>, <time>, <duration>, <penalty> OR space-separated
                cleaned = line.replace(",", " ")
                parts = cleaned.split()
                if not parts:
                    continue
                period_id = parts[0]
                date = parts[1] if len(parts) > 1 else None
                time = parts[2] if len(parts) > 2 else None
                duration = 180
                penalty = 0
                if len(parts) >= 4:
                    try:
                        duration = int(parts[3])
                    except ValueError:
                        pass
                if len(parts) >= 5:
                    try:
                        penalty = int(parts[4])
                    except ValueError:
                        pass

                dataset.periods[period_id] = Period(
                    period_id=period_id, date=date, time=time, duration=duration, penalty=penalty
                )

            elif current_section == "rooms":
                # Line format: <room_id> <capacity> <penalty>
                parts = line.replace(",", " ").split()
                if not parts:
                    continue
                room_id = parts[0]
                capacity = 100
                penalty = 0
                if len(parts) >= 2:
                    try:
                        capacity = int(parts[1])
                        if capacity <= 0:
                            errors.append(f"Line {line_num}: Room '{room_id}' capacity must be positive, got {capacity}.")
                    except ValueError:
                        errors.append(f"Line {line_num}: Room '{room_id}' capacity must be an integer, got '{parts[1]}'.")
                if len(parts) >= 3:
                    try:
                        penalty = int(parts[2])
                    except ValueError:
                        pass

                dataset.rooms[room_id] = Room(room_id=room_id, capacity=capacity, penalty=penalty)

            elif current_section in ("students", "enrollments", "studentenrollments"):
                # Line format: <student_id> <exam_id> OR student listing
                parts = line.split()
                if len(parts) == 2:
                    stu_id, ex_id = parts[0], parts[1]
                    self._add_enrollment(dataset, stu_id, ex_id)
                elif len(parts) > 2:
                    # student_id followed by exam list
                    stu_id = parts[0]
                    for ex_id in parts[1:]:
                        self._add_enrollment(dataset, stu_id, ex_id)

    def _parse_carter_exam_lines(
        self, lines: List[str], dataset: ExamDataset, errors: List[str], warnings: List[str]
    ):
        """Parse Carter benchmark format (.crs/.exm lines of: <exam_id> <student_count>)."""
        for line_num, line in enumerate(lines, 1):
            parts = line.split()
            if not parts:
                continue
            exam_id = parts[0]
            student_count = 0
            if len(parts) >= 2:
                try:
                    student_count = int(parts[1])
                except ValueError:
                    warnings.append(f"Exam line {line_num}: Expected student count integer, got '{parts[1]}'.")

            dataset.exams[exam_id] = Exam(exam_id=exam_id, enrollment_count=student_count)

    def _parse_exam_csv(
        self, lines: List[str], dataset: ExamDataset, errors: List[str], warnings: List[str]
    ):
        """Parse CSV examination or enrollment file."""
        reader = csv.reader(lines)
        rows = [row for row in reader if row and any(cell.strip() for cell in row)]
        if not rows:
            errors.append("CSV file contains no readable rows.")
            return

        headers = [col.strip().lower() for col in rows[0]]
        # Check if CSV represents exam list or student enrollment pairs
        is_enrollment_csv = any("student" in h for h in headers) and any("exam" in h or "course" in h for h in headers)

        if is_enrollment_csv:
            student_col = next(i for i, h in enumerate(headers) if "student" in h)
            exam_col = next(i for i, h in enumerate(headers) if "exam" in h or "course" in h)
            for row_idx, row in enumerate(rows[1:], 2):
                if len(row) <= max(student_col, exam_col):
                    continue
                stu_id = row[student_col].strip()
                ex_id = row[exam_col].strip()
                if stu_id and ex_id:
                    self._add_enrollment(dataset, stu_id, ex_id)
        elif len(rows[0]) == 2:
            # 2-column CSV: default to exam_id, student_id
            first_row_is_header = any(
                w in headers[0] or w in headers[1] for w in ["exam", "course", "student", "id", "code"]
            )
            exam_col = 0
            student_col = 1
            if "student" in headers[0]:
                student_col = 0
                exam_col = 1

            start_idx = 1 if first_row_is_header else 0
            for row in rows[start_idx:]:
                if len(row) >= 2:
                    ex_id = row[exam_col].strip()
                    stu_id = row[student_col].strip()
                    if ex_id and stu_id:
                        self._add_enrollment(dataset, stu_id, ex_id)
        else:
            # Assumed exam catalogue CSV
            id_col = 0
            name_col = None
            cap_col = None
            for i, h in enumerate(headers):
                if "id" in h or "code" in h:
                    id_col = i
                elif "name" in h or "title" in h:
                    name_col = i
                elif "duration" in h:
                    cap_col = i

            for row_idx, row in enumerate(rows[1:], 2):
                if len(row) <= id_col:
                    continue
                ex_id = row[id_col].strip()
                if not ex_id:
                    continue
                name = row[name_col].strip() if (name_col is not None and len(row) > name_col) else ex_id
                duration = 180
                if cap_col is not None and len(row) > cap_col:
                    try:
                        duration = int(row[cap_col].strip())
                    except ValueError:
                        pass
                dataset.exams[ex_id] = Exam(exam_id=ex_id, name=name, duration=duration)

    def _parse_student_file(
        self, filepath: str, dataset: ExamDataset, errors: List[str], warnings: List[str]
    ):
        """Parse student enrollment file (.stu, .csv, .txt)."""
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()
        except Exception as e:
            errors.append(f"Cannot read student enrollment file: {str(e)}")
            return

        if not content:
            errors.append("Student enrollment file is empty.")
            return

        lines = [line.strip() for line in content.splitlines() if line.strip()]

        # Check if first line looks like CSV header
        if "," in lines[0] and ("student" in lines[0].lower() or "exam" in lines[0].lower()):
            reader = csv.reader(lines)
            rows = [r for r in reader if r]
            headers = [h.strip().lower() for h in rows[0]]
            stu_idx = next((i for i, h in enumerate(headers) if "student" in h), 0)
            exam_idx = next((i for i, h in enumerate(headers) if "exam" in h or "course" in h), 1)

            for row in rows[1:]:
                if len(row) > max(stu_idx, exam_idx):
                    s_id = row[stu_idx].strip()
                    e_id = row[exam_idx].strip()
                    if s_id and e_id:
                        self._add_enrollment(dataset, s_id, e_id)
            return

        # Check for Carter vs ITC2007 lines
        for line_num, line in enumerate(lines, 1):
            parts = line.split()
            if not parts:
                continue

            # Case A: Two columns where first is student ID or line is `s_id exam_id`
            if len(parts) == 2 and not (parts[0].isdigit() and parts[1].isdigit() and len(lines) > 20 and all(len(l.split()) > 2 for l in lines[:5])):
                # Check if format is `student_id exam_id`
                self._add_enrollment(dataset, parts[0], parts[1])
            else:
                # Case B: Carter format (.stu file where each line is one student's exams)
                # First token may be a student identifier like 's1' or just exam IDs:
                if parts[0].lower().startswith("s") and len(parts) > 1:
                    student_id = parts[0]
                    exam_list = parts[1:]
                else:
                    student_id = f"s_{line_num}"
                    exam_list = parts

                for ex_id in exam_list:
                    self._add_enrollment(dataset, student_id, ex_id)

    def _parse_room_file(
        self, filepath: str, dataset: ExamDataset, errors: List[str], warnings: List[str]
    ):
        """Parse separate room file (.room, .rooms, .slo, .csv, .json)."""
        filename = os.path.basename(filepath).lower()

        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read().strip()
        except Exception as e:
            errors.append(f"Cannot read room/slot file: {str(e)}")
            return

        if not content:
            warnings.append(f"Room file '{filename}' was empty; skipping room assignments.")
            return

        # Check for .slo format (single integer periods count)
        if filename.endswith(".slo"):
            lines = [l.strip() for l in content.splitlines() if l.strip()]
            if len(lines) == 1 and lines[0].isdigit():
                num_slots = int(lines[0])
                for p_idx in range(1, num_slots + 1):
                    p_id = f"P_{p_idx}"
                    dataset.periods[p_id] = Period(period_id=p_id)
                return

        # Check for JSON format
        if filename.endswith(".json") or content.startswith("[") or content.startswith("{"):
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    for idx, item in enumerate(data, 1):
                        if isinstance(item, dict):
                            r_id = str(item.get("room_id") or item.get("id") or f"Room_{idx}")
                            cap = int(item.get("capacity") or item.get("size") or 100)
                            if cap <= 0:
                                errors.append(f"Room '{r_id}' capacity must be positive, got {cap}.")
                            dataset.rooms[r_id] = Room(room_id=r_id, capacity=cap)
                    return
            except json.JSONDecodeError:
                pass  # Fall through to line-based parsing

        # Check for CSV format
        if "," in content:
            reader = csv.reader(content.splitlines())
            rows = [r for r in reader if r and any(c.strip() for c in r)]
            if rows:
                headers = [h.strip().lower() for h in rows[0]]
                if any("room" in h for h in headers) or any("cap" in h for h in headers):
                    r_col = next((i for i, h in enumerate(headers) if "room" in h or "id" in h), 0)
                    c_col = next((i for i, h in enumerate(headers) if "cap" in h or "size" in h), 1)
                    for row in rows[1:]:
                        if len(row) > max(r_col, c_col):
                            r_id = row[r_col].strip()
                            try:
                                cap = int(row[c_col].strip())
                                if cap <= 0:
                                    errors.append(f"Room '{r_id}' capacity must be positive.")
                                dataset.rooms[r_id] = Room(room_id=r_id, capacity=cap)
                            except ValueError:
                                errors.append(f"Invalid capacity for room '{r_id}'.")
                    return

        # Line-based whitespace separated: <room_id> <capacity> [penalty]
        for line_num, line in enumerate(content.splitlines(), 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if len(parts) >= 2:
                r_id = parts[0]
                try:
                    cap = int(parts[1])
                    if cap <= 0:
                        errors.append(f"Line {line_num}: Room '{r_id}' capacity must be positive.")
                    dataset.rooms[r_id] = Room(room_id=r_id, capacity=cap)
                except ValueError:
                    errors.append(f"Line {line_num}: Expected room capacity integer, got '{parts[1]}'.")
            elif len(parts) == 1 and parts[0].isdigit():
                # Single period slot count line
                num_slots = int(parts[0])
                for p_idx in range(1, num_slots + 1):
                    p_id = f"P_{p_idx}"
                    dataset.periods[p_id] = Period(period_id=p_id)

    def _add_enrollment(self, dataset: ExamDataset, student_id: str, exam_id: str):
        """Register a student in an exam."""
        if not student_id or not exam_id:
            return

        if student_id not in dataset.student_enrollments:
            dataset.student_enrollments[student_id] = set()
        dataset.student_enrollments[student_id].add(exam_id)

        if exam_id not in dataset.exam_students:
            dataset.exam_students[exam_id] = set()
        dataset.exam_students[exam_id].add(student_id)

        # Ensure exam exists in dataset.exams
        if exam_id not in dataset.exams:
            dataset.exams[exam_id] = Exam(exam_id=exam_id, enrollment_count=1)
        else:
            dataset.exams[exam_id].enrollment_count = len(dataset.exam_students[exam_id])

    def _validate_and_finalize_dataset(
        self, dataset: ExamDataset, errors: List[str], warnings: List[str]
    ):
        """Validate consistency and build conflict graph."""
        if not dataset.exams:
            errors.append("No valid examinations were found in the uploaded files.")
            return

        if not dataset.student_enrollments:
            errors.append("No student enrollments were found. At least one student registration is required.")
            return

        # Check for exams without any enrolled students
        unassigned_exams = [e_id for e_id in dataset.exams if e_id not in dataset.exam_students]
        if unassigned_exams:
            warnings.append(
                f"{len(unassigned_exams)} examinations have 0 enrolled students "
                f"(e.g., {', '.join(unassigned_exams[:5])})."
            )

        # Compute conflict pairs: (e1, e2) where e1 < e2 and they share at least one student
        conflict_set: Set[Tuple[str, str]] = set()
        for stu_id, exam_set in dataset.student_enrollments.items():
            exam_list = sorted(list(exam_set))
            n = len(exam_list)
            for i in range(n):
                for j in range(i + 1, n):
                    conflict_set.add((exam_list[i], exam_list[j]))

        dataset.conflict_pairs = conflict_set
