import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { ActivityItem } from '../types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities = [] }) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'check-in':
        return <Clock size={16} className="text-green-500" />;
      case 'check-out':
        return <Clock size={16} className="text-blue-500" />;
      case 'leave-request':
        return <Calendar size={16} className="text-orange-500" />;
      case 'leave-approved':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'leave-rejected':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No recent activities</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <p className="text-sm text-gray-800">{activity.details}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;