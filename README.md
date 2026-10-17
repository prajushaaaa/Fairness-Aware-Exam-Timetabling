# Fairness-Aware University Examination Timetabling Using OR

A decision-support and scheduling application that uses Operations Research (OR) integer programming to construct university examination timetables while explicitly optimizing for student fairness metrics (e.g., minimizing consecutive exams, balancing study gaps, and distributing student workloads).

---

## Project Structure

```text
Fairness-Aware-Exam-Timetabling/
├── frontend/                 # React + Vite + Tailwind CSS frontend
│   ├── src/                  # React components, styles, and dashboard logic
│   ├── public/               # Static assets
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.js        # Vite build configuration & API proxy
├── backend/                  # Flask REST API backend
│   ├── routes/               # API endpoint definitions (e.g., health.py)
│   ├── services/             # Optimization & business logic (PuLP/CBC)
│   ├── models/               # Domain data structures and schemas
│   ├── data/                 # Sample and raw examination datasets
│   ├── tests/                # Automated unit and integration tests
│   ├── app.py                # Main Flask application entry point
│   └── requirements.txt      # Python dependencies
├── requirements.txt          # Python dependencies (root copy)
└── README.md                 # Project documentation and quickstart guide
```

---

## Tech Stack

- **Frontend**: React (v19), Vite, Tailwind CSS (v4), JavaScript
- **Backend**: Python 3.10+, Flask, Flask-CORS
- **Optimization (Upcoming phases)**: PuLP with bundled CBC solver
- **Data Processing**: Pandas
- **Visualization (Upcoming phases)**: Matplotlib
- **Testing**: Pytest

---

## Getting Started

### Prerequisites

- **Python** (version 3.10 or higher)
- **Node.js** (version 18 or higher) and **npm**

---

### 1. Backend Setup & Run

1. **Navigate to the backend directory** (or stay at root):
   ```bash
   cd backend
   ```

2. **(Recommended) Create and activate a Python virtual environment**:
   - On Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - On macOS / Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install the Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask backend server**:
   ```bash
   python app.py
   ```
   The backend will start at: `http://127.0.0.1:5000`

5. **Verify the backend health check endpoint**:
   Open in your browser or run:
   ```bash
   curl http://127.0.0.1:5000/api/health
   ```
   Expected response:
   ```json
   {
     "message": "Backend is running successfully",
     "service": "Fairness-Aware Examination Timetabling API",
     "status": "healthy"
   }
   ```

6. **Run backend tests**:
   ```bash
   pytest
   ```

---

### 2. Frontend Setup & Run

1. **Open a separate terminal window and navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at: `http://localhost:5173`

4. Open `http://localhost:5173` in your browser. The dashboard will communicate with the backend via the `/api/health` proxy and display a live health status indicator.
