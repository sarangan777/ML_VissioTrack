import React, { useState, useEffect } from 'react';
import { Clock, Search, Download, Filter } from 'lucide-react';
import { unparse } from 'papaparse';
import { format } from 'date-fns';
import BackButton from '../../components/BackButton';
import ManualAttendanceModal from '../../components/ManualAttendanceModal';
import { toast } from 'react-toastify';
import * as apiService from '../../services/api';

interface AttendanceRecord {
  id: string;
  studentInfo: {
    name: string;
    email: string;
    registrationNumber: string;
    department: string;
  };
  date: string;
  status: string;
  arrivalTime: string;
  subjectCode: string;
  location: string;
}

const AttendanceReview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedDepartment]);

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedDepartment) params.append('department', selectedDepartment);

      const response = await apiService.getAttendanceReport('', selectedDate, '', selectedDepartment);
      
      if (response.success && response.data) {
        setAttendanceRecords(response.data);
      } else {
        toast.error('Failed to load attendance data');
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = filteredRecords.map(record => ({
        'Student Name': record.studentInfo.name,
        'Registration Number': record.studentInfo.registrationNumber,
        'Department': record.studentInfo.department,
        'Date': record.date,
        'Subject': record.subjectCode,
        'Status': record.status,
        'Arrival Time': record.arrivalTime,
        'Location': record.location
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
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleManualAttendanceSubmit = async (attendanceData: any) => {
    try {
      // Here you would typically make API calls to save the attendance data
      // For now, we'll just show a success message and refresh the data
      toast.success(`Attendance marked for ${attendanceData.students.length} students`);
      fetchAttendanceData();
    } catch (error) {
      console.error('Error saving manual attendance:', error);
      toast.error('Failed to save attendance data');
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.studentInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentInfo.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentInfo.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || record.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Attendance Management</h2>
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
                placeholder="Search by name, reg. number, or email..."
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
              <option value="HNDM">HNDM</option>
              <option value="HNDE">HNDE</option>
            </select>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Total Records: {filteredRecords.length} | 
              Present: {filteredRecords.filter(r => r.status === 'Present').length} | 
              Absent: {filteredRecords.filter(r => r.status === 'Absent').length} | 
              Late: {filteredRecords.filter(r => r.status === 'Late').length}
            </p>
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
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.studentInfo.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.studentInfo.registrationNumber}
                        </div>
                        <div className="text-xs text-gray-400">
                          {record.studentInfo.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.studentInfo.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.subjectCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Present'
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'Absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{record.arrivalTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{record.location}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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