import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  department: string;
  type: 'Full Time' | 'Part Time';
  year: '1st Year' | '2nd Year' | '3rd Year';
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
  const [defaultArrivalTime, setDefaultArrivalTime] = useState('09:00');
  const [studentAttendance, setStudentAttendance] = useState<Record<string, StudentAttendance>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  // Mock data - replace with API call
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'John Doe',
      registrationNumber: 'HNDIT/FT/2023/001',
      department: 'HNDIT',
      type: 'Full Time',
      year: '1st Year'
    },
    {
      id: '2',
      name: 'Jane Smith',
      registrationNumber: 'HNDA/PT/2023/001',
      department: 'HNDA',
      type: 'Part Time',
      year: '2nd Year'
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setStudents(mockStudents);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const filteredStudents = students.filter(student => {
    const matchesDepartment = !department || student.department === department;
    const matchesType = !type || student.type === type;
    const matchesYear = !year || student.year === year;
    const matchesSearch = !searchTerm || 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDepartment && matchesType && matchesYear && matchesSearch;
  });

  const handleAttendanceChange = (studentId: string, field: keyof StudentAttendance, value: any) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        id: studentId,
        [field]: value,
        arrivalTime: field === 'status' ? defaultArrivalTime : prev[studentId]?.arrivalTime || defaultArrivalTime
      }
    }));
  };

  const handleApplyToAll = (status: StudentAttendance['status']) => {
    const newAttendance: Record<string, StudentAttendance> = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = {
        id: student.id,
        status,
        arrivalTime: defaultArrivalTime
      };
    });
    setStudentAttendance(newAttendance);
  };

  const handleSubmit = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (Object.keys(studentAttendance).length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    const attendanceData = {
      date: selectedDate,
      students: Object.values(studentAttendance).map(attendance => {
        const student = students.find(s => s.id === attendance.id);
        return {
          name: student?.name,
          regNo: student?.registrationNumber,
          status: attendance.status,
          arrivalTime: attendance.arrivalTime,
          remarks: attendance.remarks || ''
        };
      })
    };

    onSubmit(attendanceData);
    handleClose();
  };

  const handleClose = () => {
    setDepartment('');
    setType('');
    setYear('');
    setSearchTerm('');
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setDefaultArrivalTime('09:00');
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

        <div className="relative bg-white rounded-lg w-full max-w-4xl p-6">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Add Attendance Manually
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="md:col-span-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="time"
                value={defaultArrivalTime}
                onChange={(e) => setDefaultArrivalTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Default arrival time"
              />
            </div>
            <div className="md:col-span-1">
              <select
                onChange={(e) => handleApplyToAll(e.target.value as StudentAttendance['status'])}
                className="w-full p-2 border border-gray-300 rounded-lg"
                value=""
              >
                <option value="">Apply to All</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Department</option>
              <option value="HNDIT">HNDIT</option>
              <option value="HNDA">HNDA</option>
              <option value="HNDM">HNDM</option>
              <option value="HNDE">HNDE</option>
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Type</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or registration number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
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
              </div>

              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration No.
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
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {student.registrationNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={studentAttendance[student.id]?.status || ''}
                            onChange={(e) => handleAttendanceChange(student.id, 'status', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
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
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={studentAttendance[student.id]?.remarks || ''}
                            onChange={(e) => handleAttendanceChange(student.id, 'remarks', e.target.value)}
                            placeholder="Add remarks..."
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedDate || Object.keys(studentAttendance).length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Attendance
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ManualAttendanceModal;