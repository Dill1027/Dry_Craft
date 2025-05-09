import React, { useEffect, useState } from 'react';
import { getUnreadMessages, markMessageAsRead, replyToMessage } from '../services/messageService';

const MessageNotification = ({ sellerId }) => {
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [replyContents, setReplyContents] = useState({}); // Track reply content per message

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await getUnreadMessages(sellerId);
        setUnreadMessages(response.data);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
    // Poll for new messages every minute
    const interval = setInterval(fetchUnreadMessages, 60000);
    return () => clearInterval(interval);
  }, [sellerId]);

  const handleMarkAsRead = async (messageId) => {
    try {
      await markMessageAsRead(messageId);
      setUnreadMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleReply = async (messageId) => {
    try {
      const replyContent = replyContents[messageId];
      if (!replyContent?.trim()) {
        return;
      }

      await replyToMessage(messageId, replyContent);
      
      setUnreadMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, replyContent, replyAt: new Date() }
          : msg
      ));
      
      // Clear the reply content for this message
      setReplyContents(prev => ({
        ...prev,
        [messageId]: ''
      }));
    } catch (error) {
      console.error('Error replying to message:', error);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 rounded-full hover:bg-gray-100 relative flex items-center gap-2"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadMessages.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadMessages.length}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {unreadMessages.map(message => (
          <div key={message.id} className="p-4 bg-white rounded-lg shadow border border-gray-100">
            <p className="text-gray-800 mb-2">{message.content}</p>
            <div className="flex flex-col gap-2">
              <textarea
                className="w-full p-2 border rounded-lg"
                placeholder="Write a reply..."
                rows="2"
                value={replyContents[message.id] || ''}
                onChange={(e) => setReplyContents(prev => ({
                  ...prev,
                  [message.id]: e.target.value
                }))}
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleReply(message.id)}
                  disabled={!replyContents[message.id]?.trim()}
                  className={`px-4 py-2 rounded-lg ${
                    !replyContents[message.id]?.trim() 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Reply
                </button>
                <button
                  onClick={() => handleMarkAsRead(message.id)}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Mark as read
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {unreadMessages.length === 0 && (
          <p className="text-center text-gray-500 py-4">No new messages</p>
        )}
      </div>
    </div>
  );
};

export default MessageNotification;
