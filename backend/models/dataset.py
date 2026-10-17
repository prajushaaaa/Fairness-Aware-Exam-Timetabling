"""Dataset models and data structures for university examination timetabling."""

from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple


@dataclass
class Exam:
    """Represents an examination course."""
    exam_id: str
    name: Optional[str] = None
    duration: int = 180  # Default duration in minutes
    enrollment_count: int = 0


@dataclass
class Room:
    """Represents an examination room/venue."""
    room_id: str
    capacity: int
    name: Optional[str] = None
    penalty: int = 0


@dataclass
class Period:
    """Represents an examination time period/slot."""
    period_id: str
    date: Optional[str] = None
    time: Optional[str] = None
    duration: int = 180
    penalty: int = 0


@dataclass
class DatasetStatistics:
    """Statistical summary of the examination timetabling dataset."""
    num_examinations: int
    num_students: int
    num_periods: Optional[int]
    num_rooms: Optional[int]
    num_conflicts: int
    conflict_density: float
    total_enrollments: int

    def to_dict(self) -> dict:
        return {
            "num_examinations": self.num_examinations,
            "num_students": self.num_students,
            "num_periods": self.num_periods,
            "num_rooms": self.num_rooms,
            "num_conflicts": self.num_conflicts,
            "conflict_density": round(self.conflict_density, 4),
            "total_enrollments": self.total_enrollments,
        }


@dataclass
class ExamDataset:
    """Complete parsed and validated dataset representation."""
    dataset_id: str
    name: str
    format_type: str  # 'itc2007', 'carter', 'csv', 'custom'
    exams: Dict[str, Exam] = field(default_factory=dict)
    rooms: Dict[str, Room] = field(default_factory=dict)
    periods: Dict[str, Period] = field(default_factory=dict)
    student_enrollments: Dict[str, Set[str]] = field(default_factory=dict)  # student_id -> set(exam_ids)
    exam_students: Dict[str, Set[str]] = field(default_factory=dict)  # exam_id -> set(student_ids)
    conflict_pairs: Set[Tuple[str, str]] = field(default_factory=set)  # {(e1, e2) with e1 < e2}
    files_stored: Dict[str, str] = field(default_factory=dict)  # role -> safe filename
    warnings: List[str] = field(default_factory=list)

    def calculate_statistics(self) -> DatasetStatistics:
        """Compute the dataset statistics."""
        num_exams = len(self.exams)
        num_students = len(self.student_enrollments)
        num_periods = len(self.periods) if self.periods else None
        num_rooms = len(self.rooms) if self.rooms else None
        num_conflicts = len(self.conflict_pairs)

        if num_exams > 1:
            possible_conflicts = (num_exams * (num_exams - 1)) / 2
            density = num_conflicts / possible_conflicts
        else:
            density = 0.0

        total_enrollments = sum(len(exams) for exams in self.student_enrollments.values())

        return DatasetStatistics(
            num_examinations=num_exams,
            num_students=num_students,
            num_periods=num_periods,
            num_rooms=num_rooms,
            num_conflicts=num_conflicts,
            conflict_density=density,
            total_enrollments=total_enrollments,
        )
