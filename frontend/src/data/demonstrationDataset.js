/**
 * Small Demonstration Dataset for University Examination Timetabling.
 * 
 * NOTE: This is a small, clearly documented demonstration dataset created specifically
 * for initial testing of Operations Research timetabling formulations (Greedy, Standard ILP,
 * and Fairness-Aware ILP). It is NOT an external or official ITC2007 competition benchmark.
 */

export const DEMO_DATASET_NAME = "Demonstration University Examination Dataset";
export const DEMO_DEFAULT_TIMESLOTS = 4;

export const DEMO_EXAM_METADATA = [
  { examId: "CS101", name: "Introduction to Computer Science", enrolledCount: 4 },
  { examId: "CS102", name: "Data Structures & Algorithms", enrolledCount: 4 },
  { examId: "MA201", name: "Discrete Mathematics", enrolledCount: 4 },
  { examId: "PH101", name: "Engineering Physics", enrolledCount: 4 },
  { examId: "EC101", name: "Basic Electronics", enrolledCount: 4 },
  { examId: "EE201", name: "Digital Logic Design", enrolledCount: 4 },
];

export const DEMO_REGISTRATIONS_CSV = `exam_id,student_id
CS101,S1
MA201,S1
CS101,S2
PH101,S2
CS102,S3
MA201,S3
CS102,S4
EC101,S4
MA201,S5
EE201,S5
PH101,S6
EC101,S6
CS101,S7
EE201,S7
CS102,S8
PH101,S8
MA201,S9
EC101,S9
EE201,S10
CS101,S10
EC101,S11
CS102,S11
PH101,S12
EE201,S12`;

// Pre-computed preview metrics for demonstration/preview purposes only (when preview mode is explicitly enabled)
export const DEMO_PREVIEW_SCHEDULE = [
  { examId: "CS101", examName: "Introduction to Computer Science", timeSlot: "Slot 1 (Day 1 Morning)", studentCount: 4, students: "S1, S2, S7, S10" },
  { examId: "EC101", examName: "Basic Electronics", timeSlot: "Slot 1 (Day 1 Morning)", studentCount: 4, students: "S4, S6, S9, S11" },
  { examId: "MA201", examName: "Discrete Mathematics", timeSlot: "Slot 2 (Day 1 Afternoon)", studentCount: 4, students: "S1, S3, S5, S9" },
  { examId: "EE201", examName: "Digital Logic Design", timeSlot: "Slot 3 (Day 2 Morning)", studentCount: 4, students: "S5, S7, S10, S12" },
  { examId: "CS102", examName: "Data Structures & Algorithms", timeSlot: "Slot 3 (Day 2 Morning)", studentCount: 4, students: "S3, S4, S8, S11" },
  { examId: "PH101", examName: "Engineering Physics", timeSlot: "Slot 4 (Day 2 Afternoon)", studentCount: 4, students: "S2, S6, S8, S12" },
];

export const DEMO_PREVIEW_COMPARISON = [
  {
    method: "Greedy Heuristic",
    penalty: "12.0",
    maxBurden: "8",
    avgBurden: "4.2",
    status: "Feasible",
    description: "Largest-degree-first constructive assignment; no global burden balance.",
  },
  {
    method: "Standard ILP",
    penalty: "6.0",
    maxBurden: "6",
    avgBurden: "2.8",
    status: "Optimal",
    description: "Minimizes cumulative student proximity penalty across all cohorts.",
  },
  {
    method: "Fairness-Aware ILP",
    penalty: "7.0",
    maxBurden: "3",
    avgBurden: "3.1",
    status: "Optimal",
    description: "Minimizes worst-off student peak burden (Min-Max) with variance balancing.",
  },
];
