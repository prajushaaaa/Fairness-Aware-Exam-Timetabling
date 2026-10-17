import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Building,
  GraduationCap,
  Users,
  AlertTriangle,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';

export const UploadDatasetPage = () => {
  const { dataset, uploadDataset, clearDataset, setActiveTab } = useTimetable();

  const [examFile, setExamFile] = useState(null);
  const [stuFile, setStuFile] = useState(null);
  const [roomFile, setRoomFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');

  const [dragOverExams, setDragOverExams] = useState(false);
  const [dragOverStu, setDragOverStu] = useState(false);
  const [dragOverRooms, setDragOverRooms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [apiErrors, setApiErrors] = useState([]);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');

  // Handle local file selections
  const handleExamFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setExamFile(file);
      setApiErrors([]);
    }
  };

  const handleStuFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setStuFile(file);
      setApiErrors([]);
    }
  };

  const handleRoomFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRoomFile(file);
      setApiErrors([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examFile && !stuFile) {
      setApiErrors(['Please provide at least an Examination file (.exam/.crs) or Student Enrollment file (.stu).']);
      return;
    }

    setIsSubmitting(true);
    setUploadStep('Sending files to backend API (/api/dataset/upload)...');
    setApiErrors([]);
    setUploadSuccessMessage('');

    try {
      const result = await uploadDataset({
        examFile,
        stuFile,
        roomFile,
        datasetName: datasetName.trim(),
      });
      setUploadSuccessMessage(result.message || 'Dataset successfully validated!');
    } catch (err) {
      const errList = err.message ? err.message.split('; ') : ['Failed to upload dataset'];
      setApiErrors(errList);
    } finally {
      setIsSubmitting(false);
      setUploadStep('');
    }
  };

  // Helper to load benchmark sample files against the real Flask backend
  const handleLoadSampleITC2007 = async () => {
    setIsSubmitting(true);
    setUploadStep('Generating ITC2007 examination instance...');
    setApiErrors([]);

    const itcContent = [
      '[Exams:5]',
      'CS101 180',
      'CS102 120',
      'MA201 180',
      'PH101 180',
      'EC101 120',
      '[Periods:8]',
      'P1, 10:06:2026, 09:00:00, 180, 0',
      'P2, 10:06:2026, 14:00:00, 180, 0',
      'P3, 11:06:2026, 09:00:00, 180, 0',
      'P4, 11:06:2026, 14:00:00, 180, 0',
      'P5, 12:06:2026, 09:00:00, 180, 0',
      'P6, 12:06:2026, 14:00:00, 180, 0',
      'P7, 13:06:2026, 09:00:00, 180, 0',
      'P8, 13:06:2026, 14:00:00, 180, 0',
      '[Rooms:3]',
      'Auditorium_A 250 0',
      'Lecture_Hall_B 120 0',
      'Exam_Lab_C 60 0',
      '[Enrollments]',
      'STU_1001 CS101',
      'STU_1001 MA201',
      'STU_1002 CS101',
      'STU_1002 PH101',
      'STU_1003 CS102',
      'STU_1003 EC101',
      'STU_1004 MA201',
      'STU_1004 PH101',
      'STU_1005 CS101',
      'STU_1005 CS102',
    ].join('\n');

    const itcBlob = new Blob([itcContent], { type: 'text/plain' });
    const mockExamFile = new File([itcBlob], 'itc2007_sample.exam', { type: 'text/plain' });

    setExamFile(mockExamFile);
    setStuFile(null);
    setRoomFile(null);
    setDatasetName('ITC2007 Official Benchmark Instance');

    try {
      const result = await uploadDataset({
        examFile: mockExamFile,
        datasetName: 'ITC2007 Official Benchmark Instance',
      });
      setUploadSuccessMessage(result.message || 'ITC2007 instance verified by backend.');
    } catch (err) {
      setApiErrors([err.message]);
    } finally {
      setIsSubmitting(false);
      setUploadStep('');
    }
  };

  const handleLoadSampleCarterSplit = async () => {
    setIsSubmitting(true);
    setUploadStep('Generating Carter / Toronto benchmark files (.crs, .stu, .slo)...');
    setApiErrors([]);

    const crsContent = '101 45\n102 38\n103 62\n104 29\n105 50\n';
    const stuContent = [
      's_1 101 102',
      's_2 101 103',
      's_3 102 104',
      's_4 103 105',
      's_5 101 104',
      's_6 102 105',
    ].join('\n');
    const sloContent = '18\n';

    const examF = new File([new Blob([crsContent])], 'carter_benchmark.crs', { type: 'text/plain' });
    const stuF = new File([new Blob([stuContent])], 'carter_benchmark.stu', { type: 'text/plain' });
    const roomF = new File([new Blob([sloContent])], 'carter_benchmark.slo', { type: 'text/plain' });

    setExamFile(examF);
    setStuFile(stuF);
    setRoomFile(roomF);
    setDatasetName('Carter Toronto Benchmark Split');

    try {
      const result = await uploadDataset({
        examFile: examF,
        stuFile: stuF,
        roomFile: roomF,
        datasetName: 'Carter Toronto Benchmark Split',
      });
      setUploadSuccessMessage(result.message || 'Carter files verified by backend.');
    } catch (err) {
      setApiErrors([err.message]);
    } finally {
      setIsSubmitting(false);
      setUploadStep('');
    }
  };

  const handleTestInvalidUpload = async () => {
    setIsSubmitting(true);
    setUploadStep('Testing invalid file validation against backend API...');
    setApiErrors([]);

    const invalidContent = 's1 E1\n';
    const invalidRoomContent = 'room_id,capacity\nR1,-100\n';

    const stuF = new File([new Blob([invalidContent])], 'corrupt.stu', { type: 'text/plain' });
    const roomF = new File([new Blob([invalidRoomContent])], 'corrupt_rooms.csv', { type: 'text/plain' });

    try {
      await uploadDataset({
        stuFile: stuF,
        roomFile: roomF,
        datasetName: 'Invalid Test Dataset',
      });
    } catch (err) {
      setApiErrors([err.message]);
    } finally {
      setIsSubmitting(false);
      setUploadStep('');
    }
  };

  const handleReset = async () => {
    setExamFile(null);
    setStuFile(null);
    setRoomFile(null);
    setDatasetName('');
    setApiErrors([]);
    setUploadSuccessMessage('');
    await clearDataset();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Dataset Ingestion &amp; Consistency Validation
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Upload real examination and facility files to the Flask backend.
          The backend parses examination IDs, student registrations, conflict graphs, and room capacities.
        </p>
      </div>

      {/* Error Callout Banner */}
      {apiErrors.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-md text-xs shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 text-sm block mb-1">
                Dataset Validation Failed
              </span>
              <ul className="list-disc pl-4 space-y-1 text-rose-800">
                {apiErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {uploadSuccessMessage && dataset.isUploaded && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-md text-xs shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">{uploadSuccessMessage}</span>
              <span className="text-[11px] text-emerald-700">
                Backend validation complete &bull; Active Dataset ID: {dataset.datasetId}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('generate')}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Go to Generate <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Optional Dataset Name */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
            Dataset Name / Academic Term Label (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., ITC2007 Instance 1, Fall 2026 Examination Roster..."
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:border-[#9E1B32] focus:ring-1 focus:ring-[#9E1B32] bg-white text-slate-800"
          />
        </div>

        {/* 3-Column Upload Zones: Exams, Students, Rooms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Zone 1: Examination Master File */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-red-50 text-[#9E1B32]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      1. Examination File
                    </h4>
                    <span className="text-[10px] text-slate-400">Master course listing</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                  .exam / .crs / .csv
                </span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverExams(true); }}
                onDragLeave={() => setDragOverExams(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverExams(false);
                  if (e.dataTransfer.files?.[0]) setExamFile(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors min-h-[140px] flex flex-col items-center justify-center ${dragOverExams
                  ? 'border-[#9E1B32] bg-red-50/50'
                  : examFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
                  }`}
              >
                {examFile ? (
                  <div className="flex flex-col items-center">
                    <FileCheck className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 break-all">{examFile.name}</span>
                    <span className="text-[10px] text-slate-500">{(examFile.size / 1024).toFixed(1)} KB</span>
                    <label className="mt-2 text-[11px] text-[#9E1B32] hover:underline cursor-pointer">
                      Replace File
                      <input type="file" accept=".exam,.crs,.exm,.csv,.txt" className="hidden" onChange={handleExamFileChange} />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-[11px] font-medium text-slate-700">Drop ITC2007 .exam or .crs file</p>
                    <label className="mt-2 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 text-[11px] font-medium rounded hover:bg-slate-50 cursor-pointer shadow-2xs">
                      Browse File
                      <input type="file" accept=".exam,.crs,.exm,.csv,.txt" className="hidden" onChange={handleExamFileChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              ITC2007 files may bundle rooms &amp; enrollments.
            </span>
          </div>

          {/* Zone 2: Student Registrations File */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-blue-50 text-blue-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      2. Student Enrollment
                    </h4>
                    <span className="text-[10px] text-slate-400">Course registrations</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                  .stu / .csv
                </span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverStu(true); }}
                onDragLeave={() => setDragOverStu(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStu(false);
                  if (e.dataTransfer.files?.[0]) setStuFile(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors min-h-[140px] flex flex-col items-center justify-center ${dragOverStu
                  ? 'border-[#9E1B32] bg-red-50/50'
                  : stuFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
                  }`}
              >
                {stuFile ? (
                  <div className="flex flex-col items-center">
                    <FileCheck className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 break-all">{stuFile.name}</span>
                    <span className="text-[10px] text-slate-500">{(stuFile.size / 1024).toFixed(1)} KB</span>
                    <label className="mt-2 text-[11px] text-[#9E1B32] hover:underline cursor-pointer">
                      Replace File
                      <input type="file" accept=".stu,.csv,.txt" className="hidden" onChange={handleStuFileChange} />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-[11px] font-medium text-slate-700">Drop Carter .stu or enrollment CSV</p>
                    <label className="mt-2 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 text-[11px] font-medium rounded hover:bg-slate-50 cursor-pointer shadow-2xs">
                      Browse File
                      <input type="file" accept=".stu,.csv,.txt" className="hidden" onChange={handleStuFileChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Optional if enrollments are inside .exam file.
            </span>
          </div>

          {/* Zone 3: Room & Facility Dataset */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-emerald-50 text-emerald-700">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      3. Rooms &amp; Periods
                    </h4>
                    <span className="text-[10px] text-slate-400">Venues &amp; capacities</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                  .room / .slo / .csv
                </span>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverRooms(true); }}
                onDragLeave={() => setDragOverRooms(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverRooms(false);
                  if (e.dataTransfer.files?.[0]) setRoomFile(e.dataTransfer.files[0]);
                }}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors min-h-[140px] flex flex-col items-center justify-center ${dragOverRooms
                  ? 'border-[#9E1B32] bg-red-50/50'
                  : roomFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
                  }`}
              >
                {roomFile ? (
                  <div className="flex flex-col items-center">
                    <FileCheck className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-800 break-all">{roomFile.name}</span>
                    <span className="text-[10px] text-slate-500">{(roomFile.size / 1024).toFixed(1)} KB</span>
                    <label className="mt-2 text-[11px] text-[#9E1B32] hover:underline cursor-pointer">
                      Replace File
                      <input type="file" accept=".room,.rooms,.slo,.csv,.json,.txt" className="hidden" onChange={handleRoomFileChange} />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-[11px] font-medium text-slate-700">Drop room capacity or .slo file</p>
                    <label className="mt-2 px-2.5 py-1 bg-white border border-slate-300 text-slate-700 text-[11px] font-medium rounded hover:bg-slate-50 cursor-pointer shadow-2xs">
                      Browse File
                      <input type="file" accept=".room,.rooms,.slo,.csv,.json,.txt" className="hidden" onChange={handleRoomFileChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 block">
              Enables room capacity allocation constraints.
            </span>
          </div>
        </div>

        {/* Submit Actions & Real API Testing Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting || (!examFile && !stuFile)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9E1B32] hover:bg-[#85172b] disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  {uploadStep || 'Uploading & Validating...'}
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload &amp; Validate with Backend API
                </>
              )}
            </button>
            {(examFile || stuFile || roomFile || dataset.isUploaded) && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Quick API Benchmark Test Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Test Live Backend APIs:</span>
            <button
              type="button"
              onClick={handleLoadSampleITC2007}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded border border-slate-300 cursor-pointer"
            >
              ITC2007 .exam Test
            </button>
            <button
              type="button"
              onClick={handleLoadSampleCarterSplit}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded border border-slate-300 cursor-pointer"
            >
              Carter Split Test
            </button>
            <button
              type="button"
              onClick={handleTestInvalidUpload}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium rounded border border-rose-200 cursor-pointer"
              title="Uploads a file with negative capacity to verify server validation"
            >
              Test Invalid File
            </button>
          </div>
        </div>
      </form>

      {/* Verified Dataset Statistics Section (Real Uploaded Data) */}
      {dataset.isUploaded && (
        <div className="bg-white rounded-lg border-2 border-emerald-300 p-6 shadow-xs bg-emerald-50/15 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Active Dataset: {dataset.formatType?.toUpperCase() || 'VALIDATED'}
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {dataset.name}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Saved in backend sandbox: <code className="font-mono text-slate-700">{dataset.datasetId}</code>
              </p>
            </div>
            <button
              onClick={() => setActiveTab('generate')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9E1B32] hover:underline cursor-pointer"
            >
              Configure Solvers for this Dataset &rarr;
            </button>
          </div>

          {/* Core Statistics Cards (Requirements 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">1. Examinations</span>
              <span className="text-lg font-bold text-slate-900">
                {dataset.statistics.numExaminations}
              </span>
              <span className="text-[10px] text-slate-500 block">Unique courses</span>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">2. Students</span>
              <span className="text-lg font-bold text-slate-900">
                {dataset.statistics.numStudents.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">Registered candidates</span>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">3. Exam Periods</span>
              <span className="text-lg font-bold text-slate-900">
                {dataset.statistics.numPeriods !== null ? dataset.statistics.numPeriods : 'Not specified'}
              </span>
              <span className="text-[10px] text-slate-500 block">Timeslots defined</span>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">4. Available Rooms</span>
              <span className="text-lg font-bold text-slate-900">
                {dataset.statistics.numRooms !== null ? dataset.statistics.numRooms : 'Not specified'}
              </span>
              <span className="text-[10px] text-slate-500 block">Auditoriums/Halls</span>
            </div>
            <div className="p-3 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">5. Student Conflicts</span>
              <span className="text-lg font-bold text-[#9E1B32]">
                {dataset.statistics.numConflicts.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Density: {(dataset.statistics.conflictDensity * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Files and Warnings checklist */}
          <div className="pt-2 text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Files Stored in Backend:</span>
              {Object.entries(dataset.files).map(([role, fname]) => (
                <span key={role} className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                  {fname}
                </span>
              ))}
            </div>

            {dataset.warnings && dataset.warnings.length > 0 && (
              <div className="mt-2 p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold block mb-1">Consistency Warnings:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {dataset.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Format Specification Instructions Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-[#9E1B32]" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Supported Dataset Specifications (ITC2007 &amp; Carter Benchmark)
            </h4>
            <p className="text-xs text-slate-500">
              The backend validation engine supports official International Timetabling Competition formats and custom institutional files.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#9E1B32]" />
              ITC2007 Format (.exam &amp; .stu)
            </h5>
            <p className="text-slate-500 mb-2">
              Sections begin with bracketed tags and define exam durations, rooms, periods, and enrollments:
            </p>
            <pre className="font-mono text-[10px] bg-slate-900 text-slate-100 p-2.5 rounded overflow-x-auto">
              {`[Exams: 3]
CS101 180
MA201 120
[Periods: 4]
P1, 10:06:2026, 09:00:00, 180, 0
[Rooms: 2]
R1 100 0
[Enrollments]
student_1 CS101
student_1 MA201`}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h5 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#9E1B32]" />
              Carter / Toronto Benchmark Split (.crs, .stu, .slo)
            </h5>
            <p className="text-slate-500 mb-2">
              Carter standard test files splitting courses, student rosters, and timeslots:
            </p>
            <pre className="font-mono text-[10px] bg-slate-900 text-slate-100 p-2.5 rounded overflow-x-auto">
              {`// hec-s-92.crs:
101 45
102 38

// hec-s-92.stu:
s1 101 102
s2 101 103

// hec-s-92.slo:
18`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
