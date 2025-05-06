import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get(`/api/notifications/unread?userId=${user.id}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-blue-500 transition-colors duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No new notifications</p>
            ) : (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div key={notification.id} className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{notification.senderName}</span>
                        {' commented on your post: '}
                        <span className="text-gray-600">"{notification.content}"</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Link
                          to={`/post/${notification.postId}`}
                          className="text-sm text-blue-500 hover:text-blue-600"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          View Post
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
