import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import BackButton from '../components/BackButton';
import { requestNotificationPermission, onMessageListener } from '../services/notification';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/api';

interface ClassSchedule {
  id: string;
  subject: string;
  instructor: string;
  startTime: string;
  endTime: string;
  day: string;
  room: string;
  date: string;
}

const Schedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [view] = useState<'week' | 'month'>('week');
  const [scheduleData, setScheduleData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        // Store the token in your backend associated with the user
        // This is where you'd make an API call to save the token
        console.log('Notification permission granted');
      }
    };

    setupNotifications();

    // Listen for incoming messages
    const unsubscribe = onMessageListener().then((payload: any) => {
      toast.info(payload.notification.title, {
        description: payload.notification.body
      });
    });

    return () => {
      // Cleanup
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate]);

  const fetchScheduleData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getWeeklySchedule();
      
      if (response.success && response.data) {
        setScheduleData(response.data);
      } else {
        toast.error('Failed to load schedule data');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getClassesForDayAndTime = (day: string, time: string) => {
    const daySchedules = scheduleData[day] || [];
    return daySchedules.filter((cls: any) => 
      cls.startTime <= time && 
      cls.endTime > time
    );
  };

  const isCurrentTimeSlot = (day: string, time: string) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
    return day === currentDay && time === currentTime.slice(0, 2) + ':00';
  };

  const handleExportPDF = async () => {
    if (!scheduleRef.current) return;

    try {
      const canvas = await html2canvas(scheduleRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('schedule.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7494ec]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6" ref={scheduleRef}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-[#7494ec]" />
            Class Schedule
          </h2>
          <div className="flex space-x-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 text-sm bg-[#7494ec] text-white rounded-lg hover:bg-[#5b7cde] flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Schedule
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="w-20 p-3 border bg-gray-50"></th>
                {weekDays.map(day => (
                  <th key={day} className="p-3 border bg-gray-50 font-medium text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td className="p-3 border text-sm text-gray-500 font-medium">
                    {time}
                  </td>
                  {weekDays.map(day => {
                    const classes = getClassesForDayAndTime(day, time);
                    const isCurrentSlot = isCurrentTimeSlot(day, time);
                    
                    return (
                      <td 
                        key={`${day}-${time}`} 
                        className={`p-3 border ${
                          isCurrentSlot ? 'bg-blue-50' : ''
                        }`}
                      >
                        {classes.map(cls => (
                          <div 
                            key={cls.id}
                            className="bg-[#7494ec] text-white p-2 rounded-lg text-sm"
                          >
                            <div className="font-medium">{cls.subjectCode}</div>
                            <div className="text-xs opacity-90">{cls.lecturerName || 'TBA'}</div>
                            <div className="text-xs opacity-90">Room: {cls.room}</div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Schedule;