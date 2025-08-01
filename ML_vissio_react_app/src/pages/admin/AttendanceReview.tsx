import React, { useState } from 'react';
import { Clock, Search, Download, AlertTriangle } from 'lucide-react';
import { unparse } from 'papaparse';
import { format } from 'date-fns';
import BackButton from '../../components/BackButton';
import ManualAttendanceModal from '../../components/ManualAttendanceModal';
import AttendanceReviewList from '../../components/AttendanceReviewList';
import { toast } from 'react-toastify';

interface AttendanceRecord {
  id: number;
  employee: string;
  date: string;
  checkIn: string;
  status: string;
  department?: string;
  registrationNumber?: string;
  attendancePercentage: number;
}

interface ReviewRequest {
  id: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  date: string;
  currentStatus: string;
  reason: string;
  comments: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AttendanceReview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock attendance records with percentage
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 1,
      employee: 'John Doe',
      registrationNumber: 'STD001',
      department: 'HNDIT',
      date: '2024-03-10',
      checkIn: '09:00',
      status: 'Present',
      attendancePercentage: 85
    },
    {
      id: 2,
      employee: 'Jane Smith',
      registrationNumber: 'STD002',
      department: 'HNDA',
      date: '2024-03-10',
      checkIn: '08:45',
      status: 'Present',
      attendancePercentage: 72
    },
    {
      id: 3,
      employee: 'Mark Lee',
      registrationNumber: 'STD004',
      department: 'HNDM',
      date: '2024-03-10',
      checkIn: '09:05',
      status: 'Absent',
      attendancePercentage: 49
    }
  ]);

  // Mock review requests
  const [reviewRequests] = useState<ReviewRequest[]>([
    {
      id: '1',
      studentId: 'STD002',
      studentName: 'Jane Smith',
      registrationNumber: 'HNDIT/FT/2023/001',
      date: '2024-03-13',
      currentStatus: 'Absent',
      reason: 'I was present but not detected',
      comments: 'I attended the class but the system did not detect my presence',
      requestDate: '2024-03-13T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      studentId: 'STD004',
      studentName: 'Mark Lee',
      registrationNumber: 'HNDIT/FT/2023/004',
      date: '2024-03-12',
      currentStatus: 'Late',
      reason: 'Medical issue',
      comments: 'Had a doctor\'s appointment in the morning',
      requestDate: '2024-03-12T14:00:00Z',
      status: 'pending'
    }
  ]);

  const handleExportCSV = () => {
    const csvData = attendanceRecords.map(record => ({
      'Student Name': record.employee,
      'Registration Number': record.registrationNumber,
      Department: record.department,
      Date: record.date,
      'Check In': record.checkIn,
      'Attendance %': `${record.attendancePercentage}%`,
      Status: record.status
    }));

    const csv = unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualAttendanceSubmit = (attendanceData: any) => {
    const newRecords = attendanceData.students.map((student: any, index: number) => ({
      id: Math.max(...attendanceRecords.map(r => r.id)) + index + 1,
      employee: student.name,
      registrationNumber: student.registrationNumber,
      department: student.department,
      date: attendanceData.date,
      checkIn: student.arrivalTime,
      status: student.status,
      attendancePercentage: 85 // This would normally be calculated from historical data
    }));

    setAttendanceRecords(prev => [...prev, ...newRecords]);
    toast.success(`Attendance marked for ${attendanceData.students.length} students`);
  };

  const handleUpdateReviewStatus = async (requestId: string, newStatus: 'approved' | 'rejected', remarks?: string) => {
    // Mock API call - In a real application, this would be an actual API request
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Review status updated:', { requestId, newStatus, remarks });
        resolve(true);
      }, 500);
    });
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !selectedDate || record.date === selectedDate;
    const matchesStatus = !selectedStatus || record.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesDepartment = !selectedDepartment || record.department === selectedDepartment;
    return matchesSearch && matchesDate && matchesStatus && matchesDepartment;
  });

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>

      {/* Attendance Records Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Attendance Records</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Attendance
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or reg. number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Departments</option>
              <option value="HNDIT">HNDIT</option>
              <option value="HNDA">HNDA</option>
              <option value="HNDE">HNDE</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.employee}</div>
                      <div className="text-sm text-gray-500">{record.registrationNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{record.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{record.checkIn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAttendanceColor(record.attendancePercentage)}`}>
                          {record.attendancePercentage}%
                        </span>
                        {record.attendancePercentage < 80 && (
                          <div className="ml-2 group relative">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <div className="hidden group-hover:block absolute z-10 w-64 px-4 py-2 text-sm text-white bg-gray-900 rounded-lg -top-2 left-6">
                              Warning: Attendance below required threshold for exam eligibility
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status.toLowerCase() === 'present'
                          ? 'bg-green-100 text-green-800'
                          : record.status.toLowerCase() === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Requests Section */}
      <div className="mt-8">
        <AttendanceReviewList
          requests={reviewRequests}
          onUpdateStatus={handleUpdateReviewStatus}
        />
      </div>

      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleManualAttendanceSubmit}
      />
    </div>
  );
};

export default AttendanceReview;