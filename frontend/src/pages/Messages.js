import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getConversation, getUserMessages, sendMessage } from '../services/messageService';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await getUserMessages(user.id);
        setConversations(response.data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };
    fetchConversations();
  }, [user.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation) {
        try {
          const response = await getConversation(user.id, selectedConversation.id);
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation, user.id]);

  useEffect(() => {
    if (messages.length > 0) {
      const chatContainer = document.querySelector(".overflow-y-auto");
      chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await sendMessage(
        selectedConversation.sellerId,
        selectedConversation.buyerId,
        selectedConversation.productId,
        newMessage.trim()
      );

      const response = await getConversation(user.id, selectedConversation.id);
      setMessages(response.data);
      setNewMessage('');

      const updatedConversations = conversations.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, content: newMessage }
          : conv
      );
      setConversations([
        updatedConversations.find(c => c.id === selectedConversation.id),
        ...updatedConversations.filter(c => c.id !== selectedConversation.id),
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden grid grid-cols-3">
          <div className="col-span-1 border-r">
            <h2 className="text-xl font-semibold p-4 border-b">Messages</h2>
            {conversations.map(conv => {
              const isSelected = selectedConversation?.id === conv.id;
              const otherName = conv.senderId === user.id ? conv.receiverName : conv.senderName;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left transition-colors duration-200 border-b
                    ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {otherName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{otherName}</p>
                      <p className="text-sm text-gray-500 truncate">{conv.content}</p>
                    </div>
                    {conv.unread && (
                      <span className="inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="col-span-2 p-4 flex flex-col h-[80vh]">
            {selectedConversation ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderId === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-center text-gray-500">Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;