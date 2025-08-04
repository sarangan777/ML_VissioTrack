import axios from 'axios';
import {
  User,
  DashboardStats,
  ActivityItem,
  LeaveRequest,
  ApiResponse,
} from '../types';

// Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/MlvissioTrack/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== AUTH ====================

export const login = async (
  email: string,
  password: string
): Promise<ApiResponse<{ user: User; token: string }>> => {
  try {
    console.log('🔄 Making login request to:', 'http://localhost:8080/MlvissioTrack/api/login');
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 Login response status:', response.status);
    console.log('📡 Login response headers:', response.headers);
    
    const result = await response.json();
    console.log('📡 Login response data:', result);

    if (response.ok && result.success) {
      const { user, token } = result.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', user.role);

      return {
        success: true,
        data: { user, token },
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Invalid email or password.',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      data: null,
      message: 'Login failed due to network/server error.',
    };
  }
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

// ==================== PROFILE ====================

export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If we have a user ID or email, fetch fresh data from backend
    if (currentUser.id || currentUser.email) {
      const identifier = currentUser.id || currentUser.email;
      const response = await fetch(`http://localhost:8080/MlvissioTrack/api/users/profile/${identifier}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Update localStorage with fresh data
          const updatedUser = { ...currentUser, ...result.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return {
            success: true,
            data: updatedUser,
          };
        }
      }
    }
    
    // Fallback to localStorage data
    return {
      success: true,
      data: currentUser,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      success: true,
      data: currentUser,
    };
  }
};

export const updateUserProfile = async (
  profileData: Partial<User>
): Promise<ApiResponse<User>> => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const updatedUser = { ...currentUser, ...profileData };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  return {
    success: true,
    data: updatedUser,
  };
};

// ==================== UPLOAD PROFILE PICTURE ====================

export const uploadProfilePicture = async (
  file: File
): Promise<ApiResponse<{ url: string }>> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(
      'http://localhost:8080/MlvissioTrack/api/uploadProfilePicture',
      {
        method: 'POST',
        body: formData,
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: { url: result.data.url },
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Upload failed',
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      data: null,
      message: 'Upload failed due to network/server error',
    };
  }
};

// ==================== DASHBOARD ====================

export const getDashboardStats = async (): Promise<ApiResponse<any>> => {
  try {
    console.log('🔄 Making dashboard API call...');
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/stats/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    console.log('📡 Dashboard API Response Status:', response.status);
    const result = await response.json();
    console.log('Dashboard API Response:', result);

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch dashboard stats',
    };
  } catch (error: any) {
    console.error('Dashboard fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch dashboard stats',
    };
  }
};

// ==================== LEAVES & ACTIVITY (STUBS) ====================

export const getRecentActivity = async (): Promise<ApiResponse<ActivityItem[]>> => {
  try {
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/activity/recent', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch recent activity',
    };
  } catch (error: any) {
    console.error('Recent activity fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch recent activity',
    };
  }
};

export const getLeaveRequests = async (): Promise<ApiResponse<LeaveRequest[]>> => {
  return {
    success: true,
    data: [],
  };
};

export const submitLeaveRequest = async (
  leaveData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>
): Promise<ApiResponse<LeaveRequest>> => {
  return {
    success: true,
    data: {
      ...leaveData,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  };
};

// ==================== ATTENDANCE ====================

export const getAttendanceReport = async (
  email?: string,
  startDate?: string,
  endDate?: string,
  department?: string
): Promise<ApiResponse<any[]>> => {
  try {
    const params = new URLSearchParams();
    console.log('🔄 Fetching attendance report for:', { email, startDate, endDate, department });
    if (email) params.append('email', email);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (department) params.append('department', department);

    const response = await fetch(
      `http://localhost:8080/MlvissioTrack/api/attendance/report?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    console.log('📡 Attendance report response status:', response.status);
    const result = await response.json();
    console.log('📡 Attendance report response data:', result);

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch attendance report',
    };
  } catch (error: any) {
    console.error('Attendance report fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch attendance report',
    };
  }
};

export const getAttendanceStreak = async (
  studentEmail: string
): Promise<ApiResponse<{ streak: number }>> => {
  try {
    const response = await fetch(
      `http://localhost:8080/MlvissioTrack/api/attendance/streak?email=${studentEmail}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch attendance streak',
    };
  } catch (error: any) {
    console.error('Attendance streak fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch attendance streak',
    };
  }
};
export const markAttendance = async (attendanceData: {
  registrationNumber: string;
  subjectCode: string;
  status: string;
  location?: string;
  date?: string;
  arrivalTime?: string;
  remarks?: string;
}): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(
      'http://localhost:8080/MlvissioTrack/api/attendance/mark',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(attendanceData),
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to mark attendance',
    };
  } catch (error: any) {
    console.error('Mark attendance failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to mark attendance',
    };
  }
};

// ==================== STUDENT ATTENDANCE ====================

export const getStudentAttendance = async (
  email: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<any[]>> => {
  try {
    console.log('🔄 [API] Fetching student attendance for:', email, 'startDate:', startDate, 'endDate:', endDate);
    const params = new URLSearchParams();
    params.append('email', email);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `http://localhost:8080/MlvissioTrack/api/attendance/student?${params}`;
    console.log('🔄 [API] Request URL:', url);

    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    console.log('📡 [API] Student attendance response status:', response.status);
    console.log('📡 [API] Response ok:', response.ok);
    
    if (!response.ok) {
      console.error('❌ [API] Response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [API] Error response body:', errorText);
      return {
        success: false,
        data: null,
        message: `Server error: ${response.status} ${response.statusText}`,
      };
    }
    
    const result = await response.json();
    console.log('📡 [API] Student attendance response data:', result);

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
        message: result.message,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch student attendance',
    };
  } catch (error: any) {
    console.error('❌ [API] Student attendance fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch student attendance',
    };
  }
};

// ==================== SCHEDULE ====================

export const getTodaySchedule = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch(
      'http://localhost:8080/MlvissioTrack/api/schedule/today',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch today\'s schedule',
    };
  } catch (error: any) {
    console.error('Today schedule fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch today\'s schedule',
    };
  }
};

export const getWeeklySchedule = async (
  department?: string,
  year?: string,
  date?: string
): Promise<ApiResponse<any>> => {
  try {
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (year) params.append('year', year);
    if (date) params.append('date', date);

    const response = await fetch(
      `http://localhost:8080/MlvissioTrack/api/schedule/week?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch weekly schedule',
    };
  } catch (error: any) {
    console.error('Weekly schedule fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch weekly schedule',
    };
  }
};

// ==================== LECTURERS ====================

export const getLecturers = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/lecturers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch lecturers',
    };
  } catch (error: any) {
    console.error('Lecturers fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch lecturers',
    };
  }
};

// ==================== SUBJECTS ====================

export const getSubjects = async (department?: string): Promise<ApiResponse<any[]>> => {
  try {
    console.log('🔄 [API] Fetching subjects for department:', department);
    console.log('🔄 [API] Making request to subjects endpoint...');
    const params = new URLSearchParams();
    if (department) params.append('department', department);

    const url = `http://localhost:8080/MlvissioTrack/api/subjects?${params}`;
    console.log('🔄 [API] Full request URL:', url);
    
    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    console.log('📡 [API] Subjects response status:', response.status);
    console.log('📡 [API] Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ [API] Response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [API] Error response body:', errorText);
      return {
        success: false,
        data: null,
        message: `Server error: ${response.status} ${response.statusText}`,
      };
    }
    
    const result = await response.json();
    console.log('📡 [API] Subjects response data:', result);
    console.log('📡 [API] Number of subjects received:', result.data ? result.data.length : 0);

    if (response.ok && result.success) {
      console.log('✅ [API] Successfully fetched subjects:', result.data.length);
      return {
        success: true,
        data: result.data,
        message: result.message,
      };
    }

    console.error('❌ [API] API returned error:', result.message);
    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch subjects',
    };
  } catch (error: any) {
    console.error('❌ [API] Subjects fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch subjects',
    };
  }
};

// ==================== SCHEDULE MANAGEMENT ====================

export const createSchedule = async (scheduleData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/schedule/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(scheduleData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to create schedule',
    };
  } catch (error: any) {
    console.error('Create schedule failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to create schedule',
    };
  }
};

export const updateSchedule = async (scheduleId: string, scheduleData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`http://localhost:8080/MlvissioTrack/api/schedule/update/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(scheduleData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to update schedule',
    };
  } catch (error: any) {
    console.error('Update schedule failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to update schedule',
    };
  }
};

export const deleteSchedule = async (scheduleId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`http://localhost:8080/MlvissioTrack/api/schedule/delete/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to delete schedule',
    };
  } catch (error: any) {
    console.error('Delete schedule failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to delete schedule',
    };
  }
};

// ==================== USER MANAGEMENT ====================

export const createUser = async (userData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to create user',
    };
  } catch (error: any) {
    console.error('Create user failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to create user',
    };
  }
};

export const updateUser = async (userId: string, userData: any): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`http://localhost:8080/MlvissioTrack/api/users/update/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to update user',
    };
  } catch (error: any) {
    console.error('Update user failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to update user',
    };
  }
};

export const deleteUser = async (userId: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`http://localhost:8080/MlvissioTrack/api/users/delete/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to delete user',
    };
  } catch (error: any) {
    console.error('Delete user failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to delete user',
    };
  }
};

export const getAllUsers = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/users/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch users',
    };
  } catch (error: any) {
    console.error('Fetch users failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch users',
    };
  }
};

// ==================== ATTENDANCE GOAL ====================

export const getAttendanceGoal = async (): Promise<ApiResponse<{ requiredPercentage: number; description: string }>> => {
  try {
    const response = await fetch('http://localhost:8080/MlvissioTrack/api/settings/attendanceGoal', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      data: null,
      message: result.message || 'Failed to fetch attendance goal',
    };
  } catch (error: any) {
    console.error('Attendance goal fetch failed:', error);
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch attendance goal',
    };
  }
};

// ==================== PASSWORD ====================

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<void>> => {
  return {
    success: true,
    data: null,
    message: 'Password changed (not actually implemented)',
  };
};

export default api;