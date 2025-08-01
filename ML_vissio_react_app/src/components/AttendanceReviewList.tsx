import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';

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

interface AttendanceReviewListProps {
  requests: ReviewRequest[];
  onUpdateStatus: (requestId: string, newStatus: 'approved' | 'rejected', remarks?: string) => void;
}

const AttendanceReviewList: React.FC<AttendanceReviewListProps> = ({
  requests,
  onUpdateStatus
}) => {
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    try {
      await onUpdateStatus(selectedRequest.id, status, remarks);
      toast.success(`Review request ${status}`);
      setIsModalOpen(false);
      setSelectedRequest(null);
      setRemarks('');
    } catch (error) {
      toast.error('Failed to update review status');
    }
  };

  const getStatusBadgeColor = (status: ReviewRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center mb-6">
          <AlertCircle className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Attendance Review Requests</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.studentName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.registrationNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(request.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Requested: {format(new Date(request.requestDate), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.currentStatus === 'Present'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.currentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{request.reason}</div>
                    {request.comments && (
                      <div className="text-sm text-gray-500 mt-1">{request.comments}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Review Attendance Request
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Student
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedRequest.studentName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedRequest.registrationNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedRequest.date), 'MMMM dd, yyyy')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedRequest.reason}
                  </div>
                </div>

                {selectedRequest.comments && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Comments
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedRequest.comments}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Add any remarks about this review..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AttendanceReviewList;