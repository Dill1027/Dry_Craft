import React, { useEffect, useState } from 'react';
import { getBuyerMessages, replyToMessage } from '../services/messageService';

const BuyerMessages = ({ buyerId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContents, setReplyContents] = useState({});
  const [replying, setReplying] = useState({});

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await getBuyerMessages(buyerId);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching buyer messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [buyerId]);

  const handleReply = async (messageId) => {
    try {
      setReplying(prev => ({ ...prev, [messageId]: true }));
      const replyContent = replyContents[messageId];
      
      if (!replyContent?.trim()) return;

      const response = await replyToMessage(messageId, replyContent);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, ...response.data } : msg
      ));

      // Clear reply content
      setReplyContents(prev => ({ ...prev, [messageId]: '' }));
    } catch (error) {
      console.error('Error replying to message:', error);
    } finally {
      setReplying(prev => ({ ...prev, [messageId]: false }));
    }
  };

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="space-y-4">
      {messages.map(message => (
        <div key={message.id} className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-800 mb-2">{message.content}</p>
          {message.replyContent ? (
            <div className="ml-4 mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-gray-700">
                <span className="font-medium">Seller replied: </span>
                {message.replyContent}
              </p>
              <span className="text-xs text-gray-500">
                {new Date(message.replyAt).toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="mt-4">
              <textarea
                value={replyContents[message.id] || ''}
                onChange={(e) => setReplyContents(prev => ({
                  ...prev,
                  [message.id]: e.target.value
                }))}
                placeholder="Write a reply..."
                className="w-full p-2 border rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
              />
              <button
                onClick={() => handleReply(message.id)}
                disabled={replying[message.id] || !replyContents[message.id]?.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  replying[message.id] || !replyContents[message.id]?.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {replying[message.id] ? 'Sending...' : 'Reply'}
              </button>
            </div>
          )}
          <div className="mt-2 text-sm text-gray-500">
            Sent on {new Date(message.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
      {messages.length === 0 && (
        <p className="text-center text-gray-500">No messages yet</p>
      )}
    </div>
  );
};

export default BuyerMessages;
