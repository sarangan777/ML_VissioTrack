import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Clock } from 'lucide-react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import StatCard from '../../components/StatCard';
import * as apiService from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    attendanceRate: 0,
    totalCourses: 0
  });
  const [departmentChart, setDepartmentChart] = useState({
    labels: [],
    datasets: []
  });
  const [studyModeChart, setStudyModeChart] = useState({
    labels: [],
    datasets: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const statsResponse = await apiService.getDashboardStats();

      if (statsResponse.success) {
        const res = statsResponse.data;

        setStats({
          totalStudents: res.totalStudents,
          presentToday: res.presentToday,
          attendanceRate: res.attendanceRate,
          totalCourses: res.totalCourses
        });

        const deptData = res.departmentAttendance;
        const studyMode = res.studyModeCounts;

        // ✅ Department Chart
        const deptLabels = deptData.map((d: any) => d.department);
        const deptRates = deptData.map((d: any) => d.rate);
        setDepartmentChart({
          labels: deptLabels,
          datasets: [
            {
              label: 'Attendance Rate (%)',
              data: deptRates,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }
          ]
        });

        // ✅ Study Mode Pie Chart
        setStudyModeChart({
          labels: ['Full Time', 'Part Time'],
          datasets: [
            {
              data: [studyMode.fullTime, studyMode.partTime],
              backgroundColor: [
                'rgba(116, 148, 236, 0.8)',
                'rgba(34, 197, 94, 0.8)'
              ]
            }
          ]
        });
      } else {
        console.error('Failed to fetch dashboard stats:', statsResponse.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={<Clock className="w-6 h-6 text-green-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={<FileText className="w-6 h-6 text-purple-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={<Calendar className="w-6 h-6 text-orange-600" />}
          bgColor="bg-white"
          textColor="text-gray-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Attendance by Department
          </h2>
          <div className="h-[300px]">
            <Line data={departmentChart} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Course Distribution</h2>
          <div className="h-[300px]">
            <Pie data={studyModeChart} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule Overview</h2>
        <TodayScheduleTable />
      </div>
    </div>
  );
};

const TodayScheduleTable = () => {
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTodaySchedule();
      if (response.success && response.data) {
        setTodaySchedule(response.data);
      }
    } catch (error) {
      console.error('Error fetching today schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    if (currentTime < start) {
      return { status: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    } else if (currentTime >= start && currentTime <= end) {
      return { status: 'In Progress', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'Completed', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading today's schedule...</div>;
  }

  if (todaySchedule.length === 0) {
    return <div className="text-center py-4 text-gray-500">No classes scheduled for today</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {todaySchedule.map((schedule: any) => {
            const statusInfo = getCurrentStatus(schedule.startTime, schedule.endTime);
            return (
              <tr key={schedule.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {schedule.startTime} - {schedule.endTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {schedule.subjectCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {schedule.lecturerName || 'TBA'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {schedule.room}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                    {statusInfo.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
