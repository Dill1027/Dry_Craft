import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import MessageNotification from '../components/MessageNotification';
import BuyerMessages from '../components/BuyerMessages';

const Messages = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Messages</h1>
        
        {/* Message Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'received'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Received Messages
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'sent'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Sent Messages
          </button>
        </div>

        {/* Message Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {user.id ? (
            activeTab === 'received' ? (
              <MessageNotification sellerId={user.id} />
            ) : (
              <BuyerMessages buyerId={user.id} />
            )
          ) : (
            <p className="text-gray-500 text-center">Please log in to view messages</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
