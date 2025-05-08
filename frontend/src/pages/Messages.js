import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getConversation, getUserMessages, sendMessage, getGroupedConversations } from '../services/messageService';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.id) {
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const fetchConversations = useCallback(async (retryCount = 0) => {
    if (!user?.id) {
      setError('Please log in to view messages');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getUserMessages(user.id.trim());
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (retryCount < 2 && error.message !== 'User ID is required') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchConversations(retryCount + 1);
      }
      if (error.response?.status === 500) {
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setError(error.message || 'Unable to load conversations. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, navigate]);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      setHistoryLoading(true);
      const response = await getGroupedConversations(user.id);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching message history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000); // Reduced from 30000
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation) {
        try {
          const otherId = selectedConversation.senderId === user.id ? 
            selectedConversation.receiverId : selectedConversation.senderId;
          const response = await getConversation(user.id, otherId);
          setMessages(response.data.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          ));
        } catch (error) {
          console.error('Error fetching messages:', error);
          if (error.code === 'ECONNABORTED') {
            setError('Connection timeout. Please try again.');
          }
        }
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Reduced from 5000
    return () => clearInterval(interval);
  }, [selectedConversation, user.id]);

  useEffect(() => {
    if (messages.length > 0) {
      const chatContainer = document.querySelector(".overflow-y-auto");
      chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

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

      const otherId = selectedConversation.senderId === user.id ? 
        selectedConversation.receiverId : selectedConversation.senderId;
      const response = await getConversation(user.id, otherId);
      setMessages(response.data.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      ));
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const otherName = conv.senderId === user.id ? conv.receiverName : conv.senderName;
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden grid grid-cols-3">
          <div className="col-span-1 border-r">
            {/* Add search input before tabs */}
            <div className="p-4 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 py-4 text-center font-medium ${
                  activeTab === 'recent' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-center font-medium ${
                  activeTab === 'history' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chat
              </button>
            </div>

            {activeTab === 'recent' ? (
              error ? (
                <div className="p-4 text-red-500 text-center">
                  {error}
                  <button 
                    onClick={() => fetchConversations()} 
                    className="ml-2 text-blue-500 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                filteredConversations.map(conv => {
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
                          <p className="text-sm text-gray-500 truncate flex items-center gap-2">
                            <span className={conv.senderId === user.id ? "text-blue-500" : ""}>
                              {conv.senderId === user.id ? "You: " : `${conv.senderName}: `}
                            </span>
                            {conv.content}
                          </p>
                        </div>
                        {!conv.isRead && conv.receiverId === user.id && (
                          <span className="inline-flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              <div className="overflow-y-auto max-h-[calc(80vh-3rem)]">
                {historyLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  history.map((conv) => {
                    const otherName = conv.senderId === user.id ? conv.receiverName : conv.senderName;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className="w-full p-4 text-left hover:bg-gray-50 border-b flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {otherName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{otherName}</p>
                          <p className="text-sm text-gray-500">
                            {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
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
                        <p className="text-xs font-medium mb-1">
                          {message.senderId === user.id ? 'You' : message.senderName}
                        </p>
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