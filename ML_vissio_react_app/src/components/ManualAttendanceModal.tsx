import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Search, Users, Clock, CheckCircle, XCircle, Minus, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import * as apiService from '../services/api';

interface Student {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  department: string;
  year: string;
  type: string;
}

interface Subject {
  id: string;
  courseCode: string;
  courseName: string;
  semester: string;
  department: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'late' | 'absent';
  arrivalTime?: string;
  remarks?: string;
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  // Filter States
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Data States
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  
  // Attendance States
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [undoStack, setUndoStack] = useState<Map<string, AttendanceRecord>[]>([]);
  
  // UI States
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'regNumber'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Constants
  const departments = ['HNDIT', 'HNDA', 'HNDM', 'HNDE'];
  const years = ['1st Year', '2nd Year', '3rd Year'];
  const types = ['Full Time', 'Part Time'];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Fetch subjects when filters change
  useEffect(() => {
    if (selectedDepartment) {
      fetchSubjects();
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedDepartment]);

  // Fetch students when subject is selected
  useEffect(() => {
    if (selectedSubject && selectedDepartment && selectedYear && selectedType) {
      fetchStudents();
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedSubject, selectedDepartment, selectedYear, selectedType]);

  // Filter and sort students based on search and sort criteria
  useEffect(() => {
    let filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort students
    filtered.sort((a, b) => {
      let aValue = sortBy === 'name' ? a.name : a.registrationNumber;
      let bValue = sortBy === 'name' ? b.name : b.registrationNumber;
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, sortBy, sortOrder]);

  const resetForm = () => {
    setSelectedDepartment('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedSubject('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSubjects([]);
    setStudents([]);
    setFilteredStudents([]);
    setAttendanceRecords(new Map());
    setUndoStack([]);
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const fetchSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      console.log('🔄 [ManualAttendance] Fetching subjects for department:', selectedDepartment);
      const response = await apiService.getSubjects(selectedDepartment);
      console.log('📡 [ManualAttendance] Subjects response:', response);
      
      if (response.success && response.data) {
        console.log('✅ [ManualAttendance] Subjects loaded:', response.data.length);
        setSubjects(response.data);
      } else {
        console.error('❌ [ManualAttendance] Failed to load subjects:', response.message);
        toast.error('Failed to load subjects');
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error loading subjects');
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await apiService.getAllUsers();
      if (response.success && response.data) {
        // Filter students based on selected criteria
        const filteredStudents = response.data.filter((user: any) =>
          user.role === 'student' &&
          user.department === selectedDepartment &&
          user.year === selectedYear &&
          user.type === selectedType &&
          user.isActive === true
        );
        
        const studentData: Student[] = filteredStudents.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          registrationNumber: user.registrationNumber,
          department: user.department,
          year: user.year,
          type: user.type
        }));
        
        setStudents(studentData);
        
        // Initialize attendance records for all students
        const initialRecords = new Map<string, AttendanceRecord>();
        studentData.forEach(student => {
          initialRecords.set(student.id, {
            studentId: student.id,
            status: 'absent', // Default to absent
            arrivalTime: '',
            remarks: ''
          });
        });
        setAttendanceRecords(initialRecords);
        
      } else {
        toast.error('Failed to load students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error loading students');
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const saveToUndoStack = () => {
    const currentState = new Map(attendanceRecords);
    setUndoStack(prev => [...prev.slice(-9), currentState]); // Keep last 10 states
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setAttendanceRecords(new Map(previousState));
      setUndoStack(prev => prev.slice(0, -1));
      toast.success('Attendance changes undone');
    }
  };

  const updateAttendance = (studentId: string, updates: Partial<AttendanceRecord>) => {
    saveToUndoStack();
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      const existing = newRecords.get(studentId) || {
        studentId,
        status: 'absent' as const,
        arrivalTime: '',
        remarks: ''
      };
      newRecords.set(studentId, { ...existing, ...updates });
      return newRecords;
    });
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'late' | 'absent') => {
    const updates: Partial<AttendanceRecord> = { status };
    
    // Auto-set arrival time for present/late students
    if (status === 'present' || status === 'late') {
      const now = new Date();
      updates.arrivalTime = now.toTimeString().slice(0, 5); // HH:MM format
    } else {
      updates.arrivalTime = '';
    }
    
    updateAttendance(studentId, updates);
  };

  const handleMarkAllPresent = () => {
    saveToUndoStack();
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      filteredStudents.forEach(student => {
        newRecords.set(student.id, {
          studentId: student.id,
          status: 'present',
          arrivalTime: currentTime,
          remarks: ''
        });
      });
      return newRecords;
    });
    
    toast.success(`Marked all ${filteredStudents.length} students as present`);
  };

  const handleMarkAllAbsent = () => {
    saveToUndoStack();
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      filteredStudents.forEach(student => {
        newRecords.set(student.id, {
          studentId: student.id,
          status: 'absent',
          arrivalTime: '',
          remarks: ''
        });
      });
      return newRecords;
    });
    
    toast.success(`Marked all ${filteredStudents.length} students as absent`);
  };

  const handleClearAll = () => {
    saveToUndoStack();
    setAttendanceRecords(prev => {
      const newRecords = new Map(prev);
      filteredStudents.forEach(student => {
        newRecords.set(student.id, {
          studentId: student.id,
          status: 'absent',
          arrivalTime: '',
          remarks: ''
        });
      });
      return newRecords;
    });
    
    toast.info('Cleared all attendance records');
  };

  const handleSubmit = async () => {
    if (!selectedSubject || filteredStudents.length === 0) {
      toast.error('Please select a subject and ensure students are loaded');
      return;
    }

    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
    if (!selectedSubjectData) {
      toast.error('Selected subject not found');
      return;
    }

    try {
      const attendanceData = Array.from(attendanceRecords.values()).map(record => {
        const student = students.find(s => s.id === record.studentId);
        return {
          registrationNumber: student?.registrationNumber,
          subjectCode: selectedSubjectData.courseCode,
          status: record.status === 'present' ? 'Present' : 
                  record.status === 'late' ? 'Late' : 'Absent',
          location: 'Manual Entry',
          date: selectedDate,
          arrivalTime: record.arrivalTime,
          remarks: record.remarks
        };
      });

      // Submit each attendance record
      const promises = attendanceData.map(data => apiService.markAttendance(data));
      await Promise.all(promises);

      toast.success(`Attendance marked for ${attendanceData.length} students`);
      onSubmit({ attendanceData, subject: selectedSubjectData, date: selectedDate });
      onClose();
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error('Failed to submit attendance');
    }
  };

  const getStatusCounts = () => {
    const counts = { present: 0, late: 0, absent: 0 };
    filteredStudents.forEach(student => {
      const record = attendanceRecords.get(student.id);
      if (record) {
        counts[record.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const canSubmit = selectedDepartment && selectedYear && selectedType && selectedSubject && filteredStudents.length > 0;

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-600 mr-2" />
              <Dialog.Title className="text-xl font-semibold text-gray-800">
                Manual Attendance Marking
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Date and Basic Settings */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Date & Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Filters */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Student Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Subject Selection */}
            {selectedDepartment && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Subject Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoadingSubjects}
                      required
                    >
                      <option value="">
                        {isLoadingSubjects ? 'Loading subjects...' : 'Select Subject'}
                      </option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.courseCode} - {subject.courseName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {subjects.length > 0 && (
                    <div className="text-xs text-gray-500 pt-6">
                      Found {subjects.length} subjects for {selectedDepartment}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student List and Attendance Marking */}
            {selectedSubject && (
              <div className="mb-6">
                {isLoadingStudents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading students...</p>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <>
                    {/* Search and Sort Controls */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search students..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                              const [field, order] = e.target.value.split('-');
                              setSortBy(field as 'name' | 'regNumber');
                              setSortOrder(order as 'asc' | 'desc');
                            }}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="regNumber-asc">Reg. Number (A-Z)</option>
                            <option value="regNumber-desc">Reg. Number (Z-A)</option>
                          </select>
                        </div>

                        {/* Undo Button */}
                        <button
                          onClick={handleUndo}
                          disabled={undoStack.length === 0}
                          className="flex items-center px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Undo ({undoStack.length})
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={handleMarkAllPresent}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark All Present
                          </button>
                          <button
                            onClick={handleMarkAllAbsent}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark All Absent
                          </button>
                          <button
                            onClick={handleClearAll}
                            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            <Minus className="w-4 h-4 mr-2" />
                            Clear All
                          </button>
                        </div>

                        {/* Status Counts */}
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                            Present: {statusCounts.present}
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                            Late: {statusCounts.late}
                          </span>
                          <span className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                            Absent: {statusCounts.absent}
                          </span>
                          <span className="font-medium">
                            Total: {filteredStudents.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Students Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Arrival Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remarks
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredStudents.map((student) => {
                            const record = attendanceRecords.get(student.id);
                            return (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {student.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {student.registrationNumber}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {student.email}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleStatusChange(student.id, 'present')}
                                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                                        record?.status === 'present'
                                          ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                                          : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                                      }`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(student.id, 'late')}
                                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                                        record?.status === 'late'
                                          ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500'
                                          : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                                      }`}
                                    >
                                      Late
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(student.id, 'absent')}
                                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                                        record?.status === 'absent'
                                          ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                                          : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                                      }`}
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="time"
                                    value={record?.arrivalTime || ''}
                                    onChange={(e) => updateAttendance(student.id, { arrivalTime: e.target.value })}
                                    disabled={record?.status === 'absent'}
                                    className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100 disabled:text-gray-400"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <input
                                    type="text"
                                    placeholder="Optional remarks..."
                                    value={record?.remarks || ''}
                                    onChange={(e) => updateAttendance(student.id, { remarks: e.target.value })}
                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No students found for the selected criteria</p>
                    <p className="text-sm">
                      {selectedDepartment} • {selectedYear} • {selectedType}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {filteredStudents.length > 0 && (
                <>
                  {statusCounts.present + statusCounts.late} of {filteredStudents.length} students marked as present/late
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ManualAttendanceModal;