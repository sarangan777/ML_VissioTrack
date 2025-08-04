import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import * as apiService from '../services/api';
import { User } from '../types';
import { Camera, Save, X, Lock, Upload } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BackButton from '../components/BackButton';

const Profile: React.FC = () => {
  const { user: authUser, login } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    birthDate: '',
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      const response = await apiService.uploadProfilePicture(file);
      
      if (response.success && response.data) {
        const updatedUser = {
          ...user,
          profilePicture: response.data.url
        };
        
        const updateResponse = await apiService.updateUserProfile(updatedUser);
        
        if (updateResponse.success) {
          setUser(updatedUser);
          if (authUser) {
            login(updatedUser, localStorage.getItem('authToken') || '');
          }
          toast.success('Profile picture updated successfully');
        }
      }
    } catch (err) {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadProgress(0);
    }
  }, [user, authUser, login]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [Profile] Fetching user profile...');
      const response = await apiService.getUserProfile();
      
      console.log('📡 [Profile] Profile response:', response);
      
      if (response.success && response.data) {
        console.log('✅ [Profile] Profile data received:', response.data);
        console.log('📅 [Profile] Birth date from API:', response.data.birthDate);
        setUser(response.data);
        setProfileForm({
          name: response.data.name || '',
          birthDate: response.data.birthDate || '',
        });
        console.log('📝 [Profile] Form data set:', {
          name: response.data.name || '',
          birthDate: response.data.birthDate || '',
        });
      } else {
        console.error('❌ [Profile] Failed to fetch profile:', response.message);
        setError(response.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const updatedUser = {
        ...user,
        profilePicture: null
      };
      
      const response = await apiService.updateUserProfile(updatedUser);
      
      if (response.success) {
        setUser(updatedUser);
        if (authUser) {
          login(updatedUser, localStorage.getItem('authToken') || '');
        }
        toast.success('Profile picture removed successfully');
      }
    } catch (err) {
      toast.error('Failed to remove profile picture');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const updatedData = {
        ...user,
        name: profileForm.name,
        birthDate: profileForm.birthDate,
      };
      
      const response = await apiService.updateUser(user?.id || '', updatedData);
      
      if (response.success && response.data) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setUser(response.data);
        
        if (authUser) {
          const updatedUser = {
            ...authUser,
            ...response.data,
          };
          login(updatedUser, localStorage.getItem('authToken') || '');
        }
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const response = await apiService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (response.success) {
        toast.success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      toast.error('Failed to change password');
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
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-[#7494ec] border border-[#7494ec] rounded-lg hover:bg-gray-50"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative group">
                  {user?.profilePicture ? (
                    <>
                      <img 
                        src={user.profilePicture} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProfilePicture();
                        }}
                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="text-4xl text-gray-400">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              {uploadProgress > 0 && (
                <div className="absolute bottom-0 left-0 w-full bg-gray-200 h-2 rounded-full">
                  <div 
                    className="bg-[#7494ec] h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Click or drag to upload profile picture
            </p>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#7494ec] focus:border-[#7494ec]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={user?.registrationNumber || ''}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={user?.department || ''}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={profileForm.birthDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#7494ec] focus:border-[#7494ec]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileForm({ 
                      name: user?.name || '',
                      birthDate: user?.birthDate || ''
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#7494ec] text-white rounded-lg hover:bg-[#5b7cde]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                  <p className="mt-1 text-lg text-gray-900">{user?.name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-lg text-gray-900">{user?.email}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Registration Number</h3>
                  <p className="mt-1 text-lg text-gray-900">{user?.registrationNumber || 'Not assigned'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="mt-1 text-lg text-gray-900">{user?.department || 'Not specified'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {user?.birthDate ? (() => {
                      try {
                        return new Date(user.birthDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        });
                      } catch (e) {
                        console.error('Error formatting birth date:', e, 'Raw value:', user.birthDate);
                        return user.birthDate; // Show raw value if formatting fails
                      }
                    })() : 'Not specified'}
                  </p>
                </div>

                {user?.role === 'student' && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Academic Year</h3>
                      <p className="mt-1 text-lg text-gray-900">{user?.year || 'Not specified'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Study Type</h3>
                      <p className="mt-1 text-lg text-gray-900">{user?.type || 'Not specified'}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex items-center px-4 py-2 text-[#7494ec] border border-[#7494ec] rounded-lg hover:bg-gray-50"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="min-h-screen px-4 text-center">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900 mb-4"
            >
              Change Password
            </Dialog.Title>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#7494ec] focus:border-[#7494ec]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#7494ec] focus:border-[#7494ec]"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#7494ec] focus:border-[#7494ec]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7494ec] text-white rounded-lg hover:bg-[#5b7cde]"
                >
                  Change Password
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

export default Profile;