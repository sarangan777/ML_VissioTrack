import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock, Users } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BackButton from '../../components/BackButton';
import * as apiService from '../../services/api';

interface Schedule {
  id: string;
  subjectCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  year: string;
  lecturerId: string;
  lecturerName?: string;
  department: string;
}

interface ScheduleFormData {
  subject: string;
  department: string;
  day: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
}

const AdminSchedule = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [formData, setFormData] = useState<ScheduleFormData>({
    subject: '',
    department: '',
    day: '',
    scheduleDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    room: '',
    lecturer: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const departments = ['HNDIT', 'HNDA', 'HNDM', 'HNDE'];
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch subjects when filters change
  useEffect(() => {
    if (formData.department && formData.department.trim() !== '') {
      console.log('🔄 [AdminSchedule] Department changed, fetching subjects for:', formData.department);
      setSelectedDepartment(formData.department);
      fetchSubjects();
    } else {
      console.log('🔄 [AdminSchedule] No department selected, clearing subjects');
      setSubjects([]);
    }

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [schedulesResponse, lecturersResponse] = await Promise.all([
        apiService.getWeeklySchedule(),
        apiService.getLecturers()
      ]);

      if (schedulesResponse.success && schedulesResponse.data) {
        // Convert weekly schedule object to array
        const scheduleArray: Schedule[] = [];
        Object.entries(schedulesResponse.data).forEach(([day, daySchedules]) => {
          (daySchedules as any[]).forEach(schedule => {
            scheduleArray.push({
              ...schedule,
              dayOfWeek: day
            });
          });
        });
        setSchedules(scheduleArray);
      }

      if (lecturersResponse.success && lecturersResponse.data) {
        setLecturers(lecturersResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    if (!formData.department || formData.department.trim() === '') {
      console.log('⚠️ [AdminSchedule] No department selected, skipping subject fetch');
      return;
    }
    
    setIsLoadingSubjects(true);
    setSubjects([]); // Clear existing subjects
    
    try {
      console.log('🔄 [AdminSchedule] Fetching subjects for department:', formData.department);
      console.log('🔄 [AdminSchedule] API call starting...');
      
      const response = await apiService.getSubjects(formData.department);
      
      console.log('📡 [AdminSchedule] Full API response:', response);
      console.log('📡 [AdminSchedule] Response success:', response.success);
      console.log('📡 [AdminSchedule] Response data:', response.data);
      
      if (response.success && response.data) {
        console.log('✅ [AdminSchedule] Subjects loaded successfully:', response.data.length, 'subjects');
        console.log('✅ [AdminSchedule] Subject details:', response.data);
        setSubjects(response.data);
        
        if (response.data.length === 0) {
          console.log('⚠️ [AdminSchedule] No subjects found for department:', formData.department);
          toast.info(`No subjects found for department: ${formData.department}`);
        }
      } else {
        console.error('❌ [AdminSchedule] API returned error:', response.message);
        toast.error(`Failed to load subjects: ${response.message || 'Unknown error'}`);
        setSubjects([]);
      }
    } catch (error) {
      console.error('❌ [AdminSchedule] Exception during subject fetch:', error);
      toast.error(`Network error: ${error.message || 'Failed to load subjects'}`);
      setSubjects([]);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('🔄 [AdminSchedule] Input change:', name, '=', value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-populate lecturer when subject is selected
    if (name === 'subject' && value) {
      console.log('🔄 [AdminSchedule] Subject selected:', value);
      const selectedSubjectData = subjects.find(subject => subject.courseCode === value);
      console.log('🔄 [AdminSchedule] Found subject data:', selectedSubjectData);
      
      if (selectedSubjectData && selectedSubjectData.lecturerName) {
        console.log('✅ [AdminSchedule] Auto-populating lecturer:', selectedSubjectData.lecturerName);
        setFormData(prev => ({
          ...prev,
          lecturer: selectedSubjectData.lecturerName
        }));
      } else {
        console.log('⚠️ [AdminSchedule] No lecturer found for subject');
        setFormData(prev => ({
          ...prev,
          lecturer: ''
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.department || !formData.day || 
        !formData.startTime || !formData.endTime || !formData.room || !formData.scheduleDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isEditMode && selectedSchedule) {
        const response = await apiService.updateSchedule(selectedSchedule.id, formData);
        if (response.success) {
          toast.success('Schedule updated successfully');
          fetchData();
        } else {
          toast.error(response.message || 'Failed to update schedule');
        }
      } else {
        const response = await apiService.createSchedule(formData);
        if (response.success) {
          toast.success('Schedule created successfully');
          fetchData();
        } else {
          toast.error(response.message || 'Failed to create schedule');
        }
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setSelectedDepartment(schedule.department);
    setFormData({
      subject: schedule.subjectCode,
      department: schedule.department,
      day: schedule.dayOfWeek,
      scheduleDate: schedule.scheduleDate || new Date().toISOString().split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
      lecturer: schedule.lecturerName || ''
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await apiService.deleteSchedule(scheduleId);
      if (response.success) {
        toast.success('Schedule deleted successfully');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedSchedule(null);
    setSelectedDepartment('');
    setFormData({
      subject: '',
      department: '',
      day: '',
      scheduleDate: new Date().toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      room: '',
      lecturer: ''
    });
  };

  const getSchedulesByDay = () => {
    const schedulesByDay: { [key: string]: Schedule[] } = {};
    days.forEach(day => {
      schedulesByDay[day] = schedules.filter(s => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return schedulesByDay;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const schedulesByDay = getSchedulesByDay();

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Schedule Management</h2>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {days.map(day => (
              <div key={day} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 text-center">{day}</h3>
                <div className="space-y-2">
                  {schedulesByDay[day].map(schedule => (
                    <div
                      key={schedule.id}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm"
                    >
                      <div className="font-medium text-blue-800">{schedule.subjectCode}</div>
                      <div className="text-blue-600 text-xs">{schedule.scheduleDate}</div>
                      <div className="text-blue-600 text-xs">
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                      <div className="text-blue-600 text-xs">{schedule.room}</div>
                      {schedule.lecturerName && (
                        <div className="text-blue-600 text-xs">{schedule.lecturerName}</div>
                      )}
                      <div className="flex justify-end space-x-1 mt-2">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Schedule Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              {isEditMode ? 'Edit Schedule' : 'Add New Schedule'}
            </Dialog.Title>

            {/* Dynamic Filters */}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date *
                </label>
                <input
                  type="date"
                  name="scheduleDate"
                  value={formData.scheduleDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={(e) => {
                    console.log('🔄 [AdminSchedule] Department selection changed to:', e.target.value);
                    setSelectedDepartment(e.target.value);
                    setFormData(prev => ({ ...prev, department: e.target.value, subject: '' })); // Clear selected subject when department changes
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {formData.department && (
                  <div className="text-xs text-gray-500 mt-1">
                    Selected: {formData.department}
                  </div>
                )}
                {isLoadingSubjects && (
                  <div className="text-xs text-blue-500 mt-1 flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></div>
                    Loading subjects for {formData.department}...
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Code
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  disabled={isLoadingSubjects || !formData.department}
                  required
                >
                  <option value="">
                    {!formData.department ? 'Select Department First' : 
                     isLoadingSubjects ? 'Loading subjects...' : 
                     subjects.length === 0 ? 'No subjects available' : 'Select Subject'}
                  </option>
                  {subjects.map(subject => (
                    <option key={subject.courseCode} value={subject.courseCode}>
                      {subject.courseCode} - {subject.courseName}
                    </option>
                  ))}
                </select>
                {formData.department && subjects.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    ✅ {subjects.length} subjects available for {formData.department}
                  </div>
                )}
                {formData.department && !isLoadingSubjects && subjects.length === 0 && (
                  <div className="text-xs text-red-500 mt-1">
                    ⚠️ No subjects found for {formData.department}
                  </div>
                )}
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Day</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Lab 01, Room A101"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecturer
                </label>
                <input
                  type="text"
                  name="lecturer"
                  value={formData.lecturer}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="Auto-selected based on subject"
                  readOnly={!!formData.subject}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isEditMode ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminSchedule;