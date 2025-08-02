import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X, Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
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
  lecturerName?: string;
}

interface StudentAttendance {
  id: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
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
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const departments = ['HNDIT', 'HNDA', 'HNDM', 'HNDE'];
  const years = ['1st Year', '2nd Year', '3rd Year'];
  const types = ['Full Time', 'Part Time'];
  const locations = ['Lab 01', 'Lab 02', 'Lab 03', 'Lecture Hall A', 'Lecture Hall B', 'Computer Lab'];

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
      fetchSubjects();
    }
  }, [isOpen]);

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

  const filteredStudents = students.filter(student => {
    const matchesDepartment = !department || student.department === department;
    const matchesType = !type || student.type === type;
    const matchesYear = !year || student.year === year;
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDepartment && matchesType && matchesYear && matchesSearch;
  });

  const handleAttendanceChange = (studentId: string, field: keyof StudentAttendance, value: any) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        id: studentId,
        [field]: value,
        arrivalTime: field === 'status' && value !== 'Absent' ? defaultArrivalTime : prev[studentId]?.arrivalTime || defaultArrivalTime
      }
    }));
  };

  const handleApplyToAll = (status: StudentAttendance['status']) => {
    const newAttendance: Record<string, StudentAttendance> = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = {
        id: student.id,
        status,
        arrivalTime: status !== 'Absent' ? defaultArrivalTime : undefined
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

    if (Object.keys(studentAttendance).length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    try {
      setIsLoading(true);
      
      // Submit attendance for each student individually
      const promises = Object.values(studentAttendance).map(async (attendance) => {
        const student = students.find(s => s.id === attendance.id);
        if (!student) return;

        const attendanceData = {
          registrationNumber: student.registrationNumber,
          subjectCode: selectedSubject,
          status: attendance.status,
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
          studentsCount: successCount 
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
    onClose();
  };

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
              Add Attendance Manually
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
                <BookOpen className="w-4 h-4 inline mr-1" />
                Subject *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.courseCode} value={subject.courseCode}>
                    {subject.courseCode} - {subject.courseName}
                  </option>
                ))}
              </select>
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
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Years</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              onChange={(e) => handleApplyToAll(e.target.value as StudentAttendance['status'])}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value=""
            >
              <option value="">Apply to All</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
            </select>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, registration number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">
                  {filteredStudents.length} students found
                </p>
                <p className="text-sm text-gray-500">
                  {Object.keys(studentAttendance).length} students marked
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department/Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {filteredStudents.map(student => (
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
                          <div className="text-sm text-gray-900">
                            {student.department}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.year} • {student.type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={studentAttendance[student.id]?.status || ''}
                            onChange={(e) => handleAttendanceChange(student.id, 'status', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Status</option>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="Excused">Excused</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="time"
                            value={studentAttendance[student.id]?.arrivalTime || defaultArrivalTime}
                            onChange={(e) => handleAttendanceChange(student.id, 'arrivalTime', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={studentAttendance[student.id]?.status === 'Absent'}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={studentAttendance[student.id]?.remarks || ''}
                            onChange={(e) => handleAttendanceChange(student.id, 'remarks', e.target.value)}
                            placeholder="Optional remarks..."
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Required fields: Date and Subject
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
                    disabled={!selectedDate || !selectedSubject || Object.keys(studentAttendance).length === 0 || isLoading}
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