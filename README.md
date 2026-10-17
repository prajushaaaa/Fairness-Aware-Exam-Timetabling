
# Fairness-Aware University Examination Timetabling Using OR

A decision-support application for generating university examination timetables while considering student conflicts, room capacity, and scheduling fairness. The project aims to create efficient and balanced examination schedules by reducing consecutive exams, distributing study gaps, and balancing student workloads.

## Features

- Examination timetable generation.
- Consideration of student examination conflicts.
- Room-capacity considerations.
- Fairness-aware scheduling objectives.
- Comparison of scheduling approaches.
- Dashboard for interacting with the application.

*Note: Features depend on the current implementation. Optimization and comparison functionality should be marked as completed only when implemented and tested.*

## Project Structure

```text
Fairness-Aware-Exam-Timetabling/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── data/
│   ├── tests/
│   ├── app.py
│   └── requirements.txt
├── requirements.txt
└── README.md
```

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, JavaScript
- **Backend:** Python, Flask, Flask-CORS
- **Optimization:** PuLP and CBC solver (where implemented)
- **Data Processing:** Pandas
- **Visualization:** Matplotlib (where implemented)
- **Testing:** Pytest

## Prerequisites

Install the following before running the project:

- Python 3.10 or later
- Node.js 18 or later
- npm
- Git (optional, for version control)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/prajushaaaa/Fairness-Aware-Exam-Timetabling.git
cd Fairness-Aware-Exam-Timetabling
```

### 2. Set Up the Backend

Open a terminal in the project root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

If PowerShell blocks virtual-environment activation, use Command Prompt and run:

```cmd
venv\Scripts\activate.bat
```

The backend is expected to run at:

`http://127.0.0.1:5000`

If the health endpoint is implemented, test it at:

`http://127.0.0.1:5000/api/health`

### 3. Set Up the Frontend

Open a **second terminal** in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173`

### 4. Run Backend Tests

If the tests and dependencies are configured, run from the backend directory:

```powershell
pytest
```

## Project Objective

The objective is to explore how Operations Research techniques can support university examination scheduling. The project considers constraints such as student conflicts and room capacity, alongside fairness goals such as distributing examinations and study gaps more evenly.

## Future Improvements

- Implement and evaluate integer-programming-based scheduling.
- Compare scheduling algorithms using consistent test datasets.
- Improve fairness metrics and timetable evaluation.
- Add visual reports for conflicts, room utilization, and study gaps.
- Expand automated testing and validation.

## Author

**Prajusha Gangrade**

GitHub: [prajushaaaa](https://github.com/prajushaaaa)
