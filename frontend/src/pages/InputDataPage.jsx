import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileCheck,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCw,
  Clock,
  BookOpen,
  Users,
  Scale,
  HelpCircle,
} from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';
import {
  DEMO_DATASET_NAME,
  DEMO_DEFAULT_TIMESLOTS,
  DEMO_REGISTRATIONS_CSV,
} from '../data/demonstrationDataset';

export const InputDataPage = () => {
  const { dataset, uploadSimpleDataset, loadSyntheticDataset, loadDemonstrationDataset, clearDataset, setActiveTab } = useTimetable();

  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [dataText, setDataText] = useState(DEMO_REGISTRATIONS_CSV);
  const [selectedFile, setSelectedFile] = useState(null);
  const [timeSlots, setTimeSlots] = useState(dataset.timeSlots || DEMO_DEFAULT_TIMESLOTS);
  const [datasetName, setDatasetName] = useState(dataset.name || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputMode === 'file' && !selectedFile) {
      setErrors(['Please choose a CSV or text file containing exam_id, student_id rows.']);
      return;
    }
    if (inputMode === 'text' && !dataText.trim()) {
      setErrors(['Please provide examination registration data in the text area.']);
      return;
    }

    const slotsNum = parseInt(timeSlots, 10);
    if (isNaN(slotsNum) || slotsNum < 1) {
      setErrors(['Number of available time slots must be a positive integer (e.g., 3, 4, 5).']);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');

    try {
      const result = await uploadSimpleDataset({
        file: inputMode === 'file' ? selectedFile : null,
        dataText: inputMode === 'text' ? dataText : null,
        timeSlots: slotsNum,
        datasetName: datasetName.trim() || 'University Examination Dataset',
      });
      setSuccessMessage(result.message || 'Dataset successfully parsed and validated!');
    } catch (err) {
      const msgList = err.message ? err.message.split('; ') : ['Validation failed'];
      setErrors(msgList);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');
    setDataText(DEMO_REGISTRATIONS_CSV);
    setTimeSlots(DEMO_DEFAULT_TIMESLOTS);
    setDatasetName(DEMO_DATASET_NAME);
    setInputMode('text');

    try {
      const result = await loadDemonstrationDataset();
      setSuccessMessage(result.message || 'Small demonstration dataset loaded successfully!');
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadSynthetic = async () => {
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMessage('');
    try {
      const result = await loadSyntheticDataset();
      setSuccessMessage(result?.message || 'Synthetic dataset (100 students, 15 exams) activated successfully!');
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    setSelectedFile(null);
    setDataText('');
    setDatasetName('');
    setTimeSlots(DEMO_DEFAULT_TIMESLOTS);
    setErrors([]);
    setSuccessMessage('');
    await clearDataset();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Examination Dataset &amp; Time Slot Configuration
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Provide your student examination registrations where each row contains <code className="font-mono text-slate-700">exam_id, student_id</code> and specify the available time slots.
        </p>
      </div>

      {/* Errors Display */}
      {errors.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-md text-xs shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 text-sm block mb-1">
                Data Validation Error
              </span>
              <ul className="list-disc pl-4 space-y-1 text-rose-800">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && dataset.isUploaded && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-md text-xs shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">{successMessage}</span>
              <span className="text-[11px] text-emerald-700">
                Validated by Flask backend &bull; Ready for timetable generation
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('generate')}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Go to Generate &rarr;
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Dataset Input (File or Paste) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    1. Examination Registrations (<code className="text-xs font-mono">exam_id, student_id</code>)
                  </h4>
                  <p className="text-[11px] text-slate-500">Each entry links a student to an examination they must take.</p>
                </div>
                {/* Mode Selector */}
                <div className="inline-flex rounded-md p-1 bg-slate-100 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
                      inputMode === 'text' ? 'bg-white text-[#9E1B32] shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Paste / Edit CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={`px-3 py-1 font-semibold rounded transition-colors cursor-pointer ${
                      inputMode === 'file' ? 'bg-white text-[#9E1B32] shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {inputMode === 'text' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enter or paste rows (Format: <code className="font-mono text-slate-800">exam_id, student_id</code>):
                  </label>
                  <textarea
                    rows={10}
                    value={dataText}
                    onChange={(e) => setDataText(e.target.value)}
                    placeholder="exam_id,student_id&#10;CS101,S1&#10;MA201,S1&#10;CS101,S2&#10;PH101,S2"
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded focus:border-[#9E1B32] focus:ring-1 focus:ring-[#9E1B32] bg-slate-50/50 text-slate-800"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>Example: <code>CS101, S1</code> (one student enrollment per row)</span>
                    <button
                      type="button"
                      onClick={() => setDataText(DEMO_REGISTRATIONS_CSV)}
                      className="text-[#9E1B32] hover:underline cursor-pointer"
                    >
                      Fill with demo CSV
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50/50">
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <FileCheck className="w-8 h-8 text-emerald-600 mb-2" />
                      <span className="text-sm font-semibold text-slate-800">{selectedFile.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      <label className="mt-2 text-xs text-[#9E1B32] hover:underline cursor-pointer">
                        Choose Different File
                        <input type="file" accept=".csv,.txt,.stu,.exm" className="hidden" onChange={handleFileChange} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Choose a CSV or text file</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Rows of <code>exam_id, student_id</code></p>
                      <label className="mt-3 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded hover:bg-slate-50 cursor-pointer shadow-2xs">
                        Browse Computer
                        <input type="file" accept=".csv,.txt,.stu,.exm" className="hidden" onChange={handleFileChange} />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Parameters & Demo Load */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                2. Scheduling Parameters
              </h4>

              {/* Time Slots Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#9E1B32]" />
                  Number of Available Time Slots
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={timeSlots}
                  onChange={(e) => setTimeSlots(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:border-[#9E1B32] focus:ring-1 focus:ring-[#9E1B32]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  e.g., 4 slots across the examination period.
                </span>
              </div>

              {/* Dataset Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Dataset Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Course Finals Demo"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800"
                />
              </div>

              {/* 1-Click Load Pre-Configured Datasets */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Switch Active Dataset:
                </span>
                <button
                  type="button"
                  onClick={handleLoadSynthetic}
                  disabled={isSubmitting}
                  className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-[#9E1B32] border border-red-200 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9E1B32]" />
                  Activate Synthetic Dataset (100 Students, 15 Exams)
                </button>
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  disabled={isSubmitting}
                  className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Optional: Load Small Demo (12 Students, 6 Exams)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#9E1B32] hover:bg-[#85172b] disabled:opacity-50 text-white font-bold text-xs rounded shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Validating with Backend...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Validate &amp; Ingest Dataset
                  </>
                )}
              </button>

              {dataset.isUploaded && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Active Dataset
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Active Dataset Verified Statistics */}
      {dataset.isUploaded && (
        <div className="bg-white rounded-lg border-2 border-emerald-300 p-5 shadow-xs bg-emerald-50/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Verified Active Dataset
                </span>
                <h4 className="text-sm font-bold text-slate-900">{dataset.name}</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Saved in backend session &bull; Conflict graph computed
              </p>
            </div>
            <button
              onClick={() => setActiveTab('generate')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9E1B32] hover:bg-[#85172b] text-white text-xs font-semibold rounded cursor-pointer transition-colors"
            >
              Proceed to Generate Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Key Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Examinations</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">{dataset.statistics.numExaminations}</span>
              <span className="text-[10px] text-slate-500 block">Courses to schedule</span>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Students</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">{dataset.statistics.numStudents}</span>
              <span className="text-[10px] text-slate-500 block">{dataset.statistics.totalEnrollments} registrations</span>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Available Time Slots</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5">{dataset.timeSlots}</span>
              <span className="text-[10px] text-slate-500 block">Periods configured</span>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Student Conflicts</span>
              <span className="text-lg font-bold text-[#9E1B32] mt-0.5">{dataset.statistics.numConflicts}</span>
              <span className="text-[10px] text-slate-500 block">Density: {(dataset.statistics.conflictDensity * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Format Help Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#9E1B32]" />
          Format Specification
        </h4>
        <p className="text-[11px] text-slate-500">
          Your input should consist of two columns: <code>exam_id</code> and <code>student_id</code>.
          Each row signifies that a student must sit for that examination. Two exams cannot be scheduled in the same time slot if at least one student is enrolled in both.
        </p>
      </div>
    </div>
  );
};
