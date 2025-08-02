import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, Calendar, Clock, MapPin, BookOpen, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import * as apiService from '../services/api';

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  department: string;
  year: string;
  type: string;
}

interface Subject {
  courseCode: string;
  courseName: string;
  department: string;
  semester: string;
  lecturerName?: string;
}

interface StudentAttendance {
  id: string;
  isPresent: boolean;
  arrivalTime?: string;
  remarks?: string;
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (attendanceData: any) => void;
}

const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSubject, setSelectedSubject] = useState('');
  const [defaultArrivalTime, setDefaultArrivalTime] = useState(format(new Date(), 'HH:mm'));
  const [defaultLocation, setDefaultLocation] = useState('Lab 01');
  const [studentAttendance, setStudentAttendance] = useState<Record<string, StudentAttendance>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const departments = ['HNDIT', 'HNDA', 'HNDM', 'HNDE'];
  const years = ['1st Year', '2nd Year', '3rd Year'];
  const types = ['Full Time', 'Part Time'];
  const locations = ['Lab 01', 'Lab 02', 'Lab 03', 'Lecture Hall A', 'Lecture Hall B', 'Computer Lab'];

  // Year to semester mapping
  const yearToSemester = {
    '1st Year': ['1st Semester', '2nd Semester'],
    '2nd Year': ['3rd Semester', '4th Semester'],
    '3rd Year': ['5th Semester', '6th Semester']
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      fetchSubjects();
    }
  }, [isOpen]);

  useEffect(() => {
    filterStudents();
  }, [students, department, type, year, searchTerm]);

  useEffect(() => {
    filterSubjects();
  }, [subjects, department, year]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAllUsers();
      if (response.success && response.data) {
        const studentList = response.data.filter((user: any) => user.role === 'student');
        setStudents(studentList);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiService.getSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      } else {
        toast.error('Failed to load subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (department) {
      filtered = filtered.filter(student => student.department === department);
    }

    if (type) {
      filtered = filtered.filter(student => student.type === type);
    }

    if (year) {
      filtered = filtered.filter(student => student.year === year);
    }

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  };

  const filterSubjects = () => {
    let filtered = subjects;

    if (department) {
      filtered = filtered.filter(subject => subject.department === department);
    }

    if (year && yearToSemester[year as keyof typeof yearToSemester]) {
      const semesters = yearToSemester[year as keyof typeof yearToSemester];
      filtered = filtered.filter(subject => 
        semesters.includes(subject.semester)
      );
    }

    setAvailableSubjects(filtered);
  };

  const handleStudentAttendanceChange = (studentId: string, field: keyof StudentAttendance, value: any) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        id: studentId,
        [field]: value,
        arrivalTime: field === 'isPresent' && value ? defaultArrivalTime : prev[studentId]?.arrivalTime
      }
    }));
  };

  const handleSelectAll = (isPresent: boolean) => {
    const newAttendance: Record<string, StudentAttendance> = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = {
        id: student.id,
        isPresent,
        arrivalTime: isPresent ? defaultArrivalTime : undefined
      };
    });
    setStudentAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    if (!department || !year || !type) {
      toast.error('Please select department, year, and type filters');
      return;
    }

    const markedStudents = Object.values(studentAttendance).filter(att => att.isPresent !== undefined);
    
    if (markedStudents.length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    try {
      setIsLoading(true);
      
      const promises = markedStudents.map(async (attendance) => {
        const student = students.find(s => s.id === attendance.id);
        if (!student) return;

        const attendanceData = {
          registrationNumber: student.registrationNumber,
          subjectCode: selectedSubject,
          status: attendance.isPresent ? 'Present' : 'Absent',
          location: defaultLocation,
          date: selectedDate,
          arrivalTime: attendance.arrivalTime || defaultArrivalTime,
          remarks: attendance.remarks || ''
        };

        return apiService.markAttendance(attendanceData);
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result?.success).length;
      
      if (successCount > 0) {
        toast.success(`Attendance marked successfully for ${successCount} students!`);
        onSubmit({ 
          date: selectedDate, 
          subject: selectedSubject,
          studentsCount: successCount,
          department,
          year,
          type
        });
        handleClose();
      } else {
        toast.error('Failed to mark attendance for any students');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error('Failed to submit attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDepartment('');
    setType('');
    setYear('');
    setSearchTerm('');
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedSubject('');
    setDefaultArrivalTime(format(new Date(), 'HH:mm'));
    setDefaultLocation('Lab 01');
    setStudentAttendance({});
    setFilteredStudents([]);
    setAvailableSubjects([]);
    onClose();
  };

  const presentCount = Object.values(studentAttendance).filter(att => att.isPresent === true).length;
  const absentCount = Object.values(studentAttendance).filter(att => att.isPresent === false).length;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Manual Attendance Entry
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Date, Subject, and Default Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Default Time
              </label>
              <input
                type="time"
                value={defaultArrivalTime}
                onChange={(e) => setDefaultArrivalTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <select
                value={defaultLocation}
                onChange={(e) => setDefaultLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!department || !year}
              >
                <option value="">Select Subject</option>
                {availableSubjects.map(subject => (
                  <option key={subject.courseCode} value={subject.courseCode}>
                    {subject.courseCode} - {subject.courseName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Type</option>
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Students
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, reg. no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {filteredStudents.length > 0 && (
            <div className="flex justify-between items-center mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Mark All Absent
                </button>
                <button
                  onClick={() => setStudentAttendance({})}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Clear All
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Present: <span className="font-semibold text-green-600">{presentCount}</span> | 
                Absent: <span className="font-semibold text-red-600">{absentCount}</span> | 
                Total: <span className="font-semibold">{filteredStudents.length}</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {!department || !year || !type ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Please select Department, Year, and Type to view students</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No students found matching the selected criteria</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Details
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
                      {filteredStudents.map(student => {
                        const attendance = studentAttendance[student.id];
                        const isPresent = attendance?.isPresent;
                        
                        return (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleStudentAttendanceChange(student.id, 'isPresent', true)}
                                  className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
                                    isPresent === true
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                  }`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Present
                                </button>
                                <button
                                  onClick={() => handleStudentAttendanceChange(student.id, 'isPresent', false)}
                                  className={`flex items-center px-3 py-1 rounded text-sm font-medium ${
                                    isPresent === false
                                      ? 'bg-red-500 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                  }`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Absent
                                </button>
                              </div>
                            </td>
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
                              <input
                                type="time"
                                value={attendance?.arrivalTime || defaultArrivalTime}
                                onChange={(e) => handleStudentAttendanceChange(student.id, 'arrivalTime', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                                disabled={isPresent === false}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                value={attendance?.remarks || ''}
                                onChange={(e) => handleStudentAttendanceChange(student.id, 'remarks', e.target.value)}
                                placeholder="Optional remarks..."
                                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Required: Department, Year, Type, Date, and Subject
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedDate || !selectedSubject || !department || !year || !type || 
                             Object.keys(studentAttendance).length === 0 || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Attendance'
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ManualAttendanceModal;