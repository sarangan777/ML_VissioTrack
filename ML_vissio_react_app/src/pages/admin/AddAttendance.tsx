import React, { useState, useEffect } from 'react';
import { UserPlus, Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BackButton from '../../components/BackButton';
import * as apiService from '../../services/api';

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
}

const AddAttendance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    subjectCode: '',
    status: 'Present',
    arrivalTime: new Date().toTimeString().slice(0, 5),
    location: 'Lab 01',
    remarks: ''
  });

  const statusOptions = ['Present', 'Absent', 'Late', 'Excused'];
  const locationOptions = ['Lab 01', 'Lab 02', 'Lab 03', 'Lecture Hall A', 'Lecture Hall B', 'Computer Lab'];

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await apiService.getAllUsers();
      if (response.success && response.data) {
        const studentList = response.data.filter((user: any) => user.role === 'student');
        setStudents(studentList);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiService.getSubjects();
      if (response.success && response.data) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const handleRegistrationNumberChange = (regNumber: string) => {
    setFormData(prev => ({ ...prev, registrationNumber: regNumber }));
    
    if (regNumber) {
      const selectedStudent = students.find(student => student.registrationNumber === regNumber);
      if (selectedStudent) {
        setFormData(prev => ({
          ...prev,
          studentName: selectedStudent.name
        }));
      } else {
        setFormData(prev => ({ ...prev, studentName: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, studentName: '' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'registrationNumber') {
      handleRegistrationNumberChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.registrationNumber || !formData.subjectCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.studentName) {
      toast.error('Invalid registration number - student not found');
      return;
    }

    setIsLoading(true);

    try {
      const attendanceData = {
        registrationNumber: formData.registrationNumber,
        subjectCode: formData.subjectCode,
        status: formData.status,
        location: formData.location,
        date: formData.date,
        arrivalTime: formData.arrivalTime,
        remarks: formData.remarks
      };

      const response = await apiService.markAttendance(attendanceData);
      
      if (response.success) {
        toast.success('Attendance added successfully!');
        // Reset form
        setFormData({
          registrationNumber: '',
          studentName: '',
          date: new Date().toISOString().split('T')[0],
          subjectCode: '',
          status: 'Present',
          arrivalTime: new Date().toTimeString().slice(0, 5),
          location: 'Lab 01',
          remarks: ''
        });
      } else {
        toast.error(response.message || 'Failed to add attendance');
      }
    } catch (error) {
      console.error('Error adding attendance:', error);
      toast.error('Failed to add attendance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <UserPlus className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Add Attendance Record</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <select
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Registration Number</option>
                  {students.map(student => (
                    <option key={student.id} value={student.registrationNumber}>
                      {student.registrationNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="Name will appear automatically"
                  disabled
                />
              </div>
            </div>

            {/* Date and Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
            </div>

            {/* Status and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Arrival Time
                </label>
                <input
                  type="time"
                  name="arrivalTime"
                  value={formData.arrivalTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {locationOptions.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional remarks or notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    registrationNumber: '',
                    studentName: '',
                    date: new Date().toISOString().split('T')[0],
                    subjectCode: '',
                    status: 'Present',
                    arrivalTime: new Date().toTimeString().slice(0, 5),
                    location: 'Lab 01',
                    remarks: ''
                  });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Attendance'
                )}
              </button>
            </div>
          </form>

          {/* Student Info Display */}
          {formData.studentName && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Selected Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Name:</span>
                  <span className="ml-2 text-blue-600">{formData.studentName}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Registration:</span>
                  <span className="ml-2 text-blue-600">{formData.registrationNumber}</span>
                </div>
                {students.find(s => s.registrationNumber === formData.registrationNumber) && (
                  <div>
                    <span className="font-medium text-blue-700">Department:</span>
                    <span className="ml-2 text-blue-600">
                      {students.find(s => s.registrationNumber === formData.registrationNumber)?.department}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddAttendance;