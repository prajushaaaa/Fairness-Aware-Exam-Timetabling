import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEMO_DATASET_NAME,
  DEMO_DEFAULT_TIMESLOTS,
  DEMO_REGISTRATIONS_CSV,
  DEMO_PREVIEW_SCHEDULE,
  DEMO_PREVIEW_COMPARISON,
} from '../data/demonstrationDataset';

const TimetableContext = createContext(null);

export const TimetableProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previewMode, setPreviewMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Backend Health State
  const [backendHealth, setBackendHealth] = useState({
    status: 'checking', // 'online' | 'offline' | 'checking'
    data: null,
    error: null,
  });

  // Default to the generated synthetic dataset (15 exams, 100 students, 6 slots, 30 conflicts)
  const [dataset, setDataset] = useState({
    isUploaded: true,
    datasetId: 'synthetic_dataset',
    name: 'Synthetic Dataset — Demonstration University',
    timeSlots: 6,
    statistics: {
      numExaminations: 15,
      numStudents: 100,
      numPeriods: 6,
      numRooms: 3,
      numConflicts: 30,
      conflictDensity: 0.2857,
      totalEnrollments: 300,
    },
    files: {},
    warnings: [],
  });

  // Solver Configuration State (Three Methods)
  const [solverConfig, setSolverConfig] = useState({
    method: 'greedy', // 'greedy' | 'standard_ilp' | 'fairness_ilp'
    fairnessWeight: 0.5, // Lambda (0.0 - 1.0) for Fairness-Aware ILP
    timeSlots: 6,
    datasetType: 'synthetic',
  });

  // Solver Run State
  const [solverRun, setSolverRun] = useState({
    hasGenerated: false,
    isGenerating: false,
    method: null,
    status: null,
    runtime: null,
    hard_constraint_violations: null,
    conventional_penalty: null,
    average_student_burden: null,
    maximum_student_burden: null,
    schedule: null,
    error: null,
  });

  // Honest record of executed algorithms (no invented comparison metrics)
  const [algorithmHistory, setAlgorithmHistory] = useState({});

  // Activity Log
  const [activityLog, setActivityLog] = useState([
    {
      id: 'init-1',
      action: 'System Ready',
      details: 'Fairness-Aware Examination Timetabling dashboard loaded.',
      timestamp: 'Today',
      type: 'system',
    },
  ]);

  // Check backend health
  const checkHealth = async () => {
    setBackendHealth((prev) => ({ ...prev, status: 'checking', error: null }));
    try {
      const response = await fetch('/api/health');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setBackendHealth({ status: 'online', data, error: null });
    } catch (err) {
      setBackendHealth({
        status: 'offline',
        data: null,
        error: err.message || 'Cannot reach Flask backend at /api/health',
      });
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!ignore) setBackendHealth({ status: 'online', data, error: null });
      })
      .catch((err) => {
        if (!ignore) {
          setBackendHealth({
            status: 'offline',
            data: null,
            error: err.message || 'Cannot reach Flask backend at /api/health',
          });
        }
      });

    // Hydrate active dataset from backend if one exists
    fetch('/api/dataset/current')
      .then((res) => res.json())
      .then((result) => {
        if (!ignore && result.status === 'success' && result.dataset) {
          const ds = result.dataset;
          setDataset({
            isUploaded: true,
            datasetId: ds.dataset_id,
            name: ds.name,
            timeSlots: ds.statistics.num_periods || DEMO_DEFAULT_TIMESLOTS,
            statistics: {
              numExaminations: ds.statistics.num_examinations,
              numStudents: ds.statistics.num_students,
              numPeriods: ds.statistics.num_periods,
              numRooms: ds.statistics.num_rooms,
              numConflicts: ds.statistics.num_conflicts,
              conflictDensity: ds.statistics.conflict_density,
              totalEnrollments: ds.statistics.total_enrollments,
            },
            files: ds.files || {},
            warnings: ds.warnings || [],
          });
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  // UI Preview Mode Toggle
  const enableSamplePreview = () => {
    setPreviewMode(true);
    setActivityLog((prev) => [
      {
        id: `act-${Date.now()}`,
        action: 'Demonstration Preview Enabled',
        details: 'Displaying demonstration preview schedule for layout evaluation.',
        timestamp: 'Just now',
        type: 'preview',
      },
      ...prev,
    ]);
  };

  const disableSamplePreview = () => {
    setPreviewMode(false);
  };

  // Upload or Input Simple Dataset (exam_id, student_id + time_slots)
  const uploadSimpleDataset = async ({ file, dataText, timeSlots, datasetName }) => {
    const formData = new FormData();
    if (file) {
      formData.append('exam_file', file);
    } else if (dataText) {
      formData.append('data_text', dataText);
    }
    formData.append('time_slots', String(timeSlots || DEMO_DEFAULT_TIMESLOTS));
    if (datasetName) {
      formData.append('dataset_name', datasetName);
    }

    const response = await fetch('/api/dataset/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.errors ? data.errors.join('; ') : data.message || 'Dataset upload failed';
      throw new Error(errorMsg);
    }

    const stats = data.statistics || {};
    const slotsCount = stats.num_periods || Number(timeSlots) || DEMO_DEFAULT_TIMESLOTS;

    setDataset({
      isUploaded: true,
      datasetId: data.dataset_id,
      name: data.name,
      timeSlots: slotsCount,
      statistics: {
        numExaminations: stats.num_examinations ?? 0,
        numStudents: stats.num_students ?? 0,
        numPeriods: slotsCount,
        numRooms: stats.num_rooms ?? null,
        numConflicts: stats.num_conflicts ?? 0,
        conflictDensity: stats.conflict_density ?? 0.0,
        totalEnrollments: stats.total_enrollments ?? 0,
      },
      files: data.files || {},
      warnings: data.warnings || [],
    });

    setSolverConfig((prev) => ({
      ...prev,
      timeSlots: slotsCount,
    }));

    setPreviewMode(false);

    setActivityLog((prev) => [
      {
        id: `act-${Date.now()}`,
        action: 'Dataset Validated',
        details: `${data.name}: ${stats.num_examinations} exams, ${stats.num_students} students, ${stats.num_conflicts} conflicts across ${slotsCount} slots`,
        timestamp: 'Just now',
        type: 'dataset',
      },
      ...prev,
    ]);

    return data;
  };

  // Activate project synthetic dataset (100 students, 15 exams, 6 slots)
  const loadSyntheticDataset = async () => {
    try {
      const response = await fetch('/api/dataset/synthetic', { method: 'POST' });
      const result = await response.json();
      if (result.status === 'success' && result.dataset) {
        const ds = result.dataset;
        setDataset({
          isUploaded: true,
          datasetId: ds.dataset_id,
          name: ds.name,
          timeSlots: ds.statistics.num_periods || 6,
          statistics: {
            numExaminations: ds.statistics.num_examinations,
            numStudents: ds.statistics.num_students,
            numPeriods: ds.statistics.num_periods,
            numRooms: ds.statistics.num_rooms,
            numConflicts: ds.statistics.num_conflicts,
            conflictDensity: ds.statistics.conflict_density,
            totalEnrollments: ds.statistics.total_enrollments,
          },
          files: ds.files || {},
          warnings: ds.warnings || [],
        });
        setSolverConfig((prev) => ({
          ...prev,
          timeSlots: ds.statistics.num_periods || 6,
          datasetType: 'synthetic',
        }));
        setPreviewMode(false);
        setActivityLog((prev) => [
          {
            id: `act-${Date.now()}`,
            action: 'Synthetic Dataset Activated',
            details: `Active dataset: ${ds.statistics.num_examinations} exams, ${ds.statistics.num_students} students, ${ds.statistics.num_conflicts} conflicts across ${ds.statistics.num_periods} slots`,
            timestamp: 'Just now',
            type: 'dataset',
          },
          ...prev,
        ]);
        return result;
      }
    } catch (err) {
      console.error('Failed to activate synthetic dataset:', err);
    }
  };

  // 1-Click Load Demonstration Dataset against the real Flask backend
  const loadDemonstrationDataset = async () => {
    return await uploadSimpleDataset({
      dataText: DEMO_REGISTRATIONS_CSV,
      timeSlots: DEMO_DEFAULT_TIMESLOTS,
      datasetName: DEMO_DATASET_NAME,
    });
  };

  // Reset Dataset back to default synthetic dataset
  const clearDataset = async () => {
    try {
      await fetch('/api/dataset/current', { method: 'DELETE' });
    } catch {
      // Ignore network errors
    }

    await loadSyntheticDataset();

    setSolverRun({
      hasGenerated: false,
      isGenerating: false,
      method: null,
      status: null,
      runtime: null,
      hard_constraint_violations: null,
      conventional_penalty: null,
      average_student_burden: null,
      maximum_student_burden: null,
      schedule: null,
      error: null,
    });
    setAlgorithmHistory({});
  };

  // Real backend timetable generation using active dataset
  const generateTimetable = async (options = {}) => {
    const selectedMethod = options.method || solverConfig.method || 'greedy';
    const selectedWeight = typeof options.fairnessWeight === 'number'
      ? options.fairnessWeight
      : solverConfig.fairnessWeight;
    const isSynthetic = dataset.datasetId === 'synthetic_dataset';
    const selectedDatasetType = options.datasetType || (isSynthetic ? 'synthetic' : 'active');

    setSolverRun((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    const payload = {
      method: selectedMethod,
      fairness_weight: selectedWeight,
      dataset_type: selectedDatasetType,
      time_slots: dataset.timeSlots || 6,
    };

    try {
      let response;
      try {
        response = await fetch('http://127.0.0.1:5000/api/timetable/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback to relative proxied endpoint
        response = await fetch('/api/timetable/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok && data.status !== 'Infeasible') {
        throw new Error(data.error || `HTTP ${response.status}: Failed to generate timetable`);
      }

      const mappedSchedule = (data.schedule || []).map((item) => ({
        examId: item.exam_id,
        exam_id: item.exam_id,
        examName: item.exam_name,
        exam_name: item.exam_name,
        roomId: item.room_id,
        room_id: item.room_id,
        roomName: item.room_name,
        room_name: item.room_name,
        slotIndex: item.slot_index,
        slot_index: item.slot_index,
        timeSlot: item.time_slot_name || item.time_slot,
        time_slot: item.time_slot,
        time_slot_name: item.time_slot_name,
        studentCount: item.student_count,
        student_count: item.student_count,
        students: item.students || '',
      }));

      // Update honest algorithm history - record real metrics without inventing fake comparisons
      setAlgorithmHistory((prev) => ({
        ...prev,
        [selectedMethod]: {
          method:
            selectedMethod === 'greedy'
              ? 'Greedy Heuristic'
              : selectedMethod === 'standard_ilp'
              ? 'Standard ILP'
              : 'Fairness-Aware ILP',
          penalty: data.conventional_penalty !== undefined ? String(data.conventional_penalty) : '—',
          maxBurden: data.maximum_student_burden !== undefined ? String(data.maximum_student_burden) : '—',
          avgBurden: data.average_student_burden !== undefined ? String(data.average_student_burden) : '—',
          status: data.status,
          runtime: `${data.runtime}s`,
          violations: data.hard_constraint_violations,
          description:
            selectedMethod === 'greedy'
              ? 'Constructive heuristic by conflict degree; fast baseline.'
              : selectedMethod === 'standard_ilp'
              ? 'PuLP / CBC minimizing cumulative proximity penalty.'
              : `PuLP / CBC Min-Max peak burden reduction (λ=${selectedWeight.toFixed(2)}).`,
        },
      }));

      setSolverRun({
        hasGenerated: true,
        isGenerating: false,
        method: selectedMethod,
        status: data.status,
        runtime: data.runtime,
        hard_constraint_violations: data.hard_constraint_violations,
        conventional_penalty: data.conventional_penalty,
        average_student_burden: data.average_student_burden,
        maximum_student_burden: data.maximum_student_burden,
        schedule: mappedSchedule,
        error: data.status === 'Infeasible'
          ? (data.error || 'The solver proved the timetabling model is Infeasible for the given slots.')
          : data.error,
        raw: data,
      });

      setPreviewMode(false);

      setActivityLog((prev) => [
        {
          id: `act-${Date.now()}`,
          action: `Timetable Generated (${data.method || selectedMethod})`,
          details: `Status: ${data.status}, Runtime: ${data.runtime}s, Violations: ${data.hard_constraint_violations}, Scheduled: ${mappedSchedule.length} exams`,
          timestamp: 'Just now',
          type: data.status === 'Infeasible' ? 'warning' : 'solver',
        },
        ...prev,
      ]);

      return data;
    } catch (err) {
      setSolverRun((prev) => ({
        ...prev,
        isGenerating: false,
        hasGenerated: true,
        status: 'Error',
        error: err.message || 'Error occurred while connecting to backend solver.',
        schedule: [],
      }));
      throw err;
    }
  };

  // Stats Resolution: Real data takes precedence; preview mode is only for explicit demo testing
  const isDataAvailable = dataset.isUploaded || previewMode;

  const currentStats = dataset.isUploaded
    ? {
        totalExams: dataset.statistics.numExaminations,
        totalStudents: dataset.statistics.numStudents,
        availablePeriods: dataset.timeSlots || dataset.statistics.numPeriods || DEMO_DEFAULT_TIMESLOTS,
        numConflicts: dataset.statistics.numConflicts,
        conflictDensity: (dataset.statistics.conflictDensity * 100).toFixed(1) + '%',
        totalEnrollments: dataset.statistics.totalEnrollments,
        datasetName: dataset.name,
        isReal: true,
      }
    : previewMode
    ? {
        totalExams: 6,
        totalStudents: 12,
        availablePeriods: DEMO_DEFAULT_TIMESLOTS,
        numConflicts: 9,
        conflictDensity: '60.0%',
        totalEnrollments: 24,
        datasetName: DEMO_DATASET_NAME,
        isReal: false,
      }
    : {
        totalExams: 0,
        totalStudents: 0,
        availablePeriods: 0,
        numConflicts: 0,
        conflictDensity: '0.0%',
        totalEnrollments: 0,
        datasetName: null,
        isReal: false,
      };

  // Schedule: real generated schedule takes precedence, or demo preview if enabled
  const currentSchedule = previewMode ? DEMO_PREVIEW_SCHEDULE : solverRun.schedule;

  // Comparison Results: real executed methods without fake metrics for unrun algorithms
  const currentComparison = previewMode
    ? DEMO_PREVIEW_COMPARISON
    : solverRun.hasGenerated
    ? [
        algorithmHistory['greedy'] || {
          method: 'Greedy Heuristic',
          penalty: '—',
          maxBurden: '—',
          avgBurden: '—',
          status: 'Not Run',
          description: 'Constructive heuristic: orders examinations by conflict degree.',
        },
        algorithmHistory['standard_ilp'] || {
          method: 'Standard ILP',
          penalty: '—',
          maxBurden: '—',
          avgBurden: '—',
          status: 'Not Run',
          description: 'PuLP / CBC: minimizes cumulative student proximity penalty.',
        },
        algorithmHistory['fairness_ilp'] || {
          method: 'Fairness-Aware ILP',
          penalty: '—',
          maxBurden: '—',
          avgBurden: '—',
          status: 'Not Run',
          description: 'PuLP / CBC: Min-Max mathematical formulation bounding peak student burden.',
        },
      ]
    : null;

  return (
    <TimetableContext.Provider
      value={{
        activeTab,
        setActiveTab,
        previewMode,
        setPreviewMode,
        enableSamplePreview,
        disableSamplePreview,
        sidebarCollapsed,
        setSidebarCollapsed,
        backendHealth,
        checkHealth,
        dataset,
        uploadSimpleDataset,
        loadSyntheticDataset,
        loadDemonstrationDataset,
        clearDataset,
        solverConfig,
        setSolverConfig,
        solverRun,
        setSolverRun,
        algorithmHistory,
        generateTimetable,
        isDataAvailable,
        currentStats,
        currentSchedule,
        currentComparison,
        activityLog,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};
