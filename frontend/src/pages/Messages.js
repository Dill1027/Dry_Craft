import React from 'react';
import { Navigate } from 'react-router-dom';
import MessageNotification from '../components/MessageNotification';

const Messages = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Messages</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {user.id ? (
            <MessageNotification sellerId={user.id} />
          ) : (
            <p className="text-gray-500 text-center">Please log in to view messages</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
