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
    const interval = setInterval(fetchConversations, 15000);
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
    const interval = setInterval(fetchMessages, 10000);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden grid grid-cols-3 border border-white/50">
          {/* Conversations List */}
          <div className="col-span-1 border-r border-gray-200">
            {/* Search Bar */}
            <div className="p-4 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 
                           focus:ring-2 focus:ring-purple-500 focus:border-transparent
                           bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
                <svg
                  className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {["recent", "history"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-center font-medium transition-all duration-200
                    ${activeTab === tab 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-500 hover:text-purple-500'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Conversations */}
            <div className="overflow-y-auto h-[calc(80vh-8rem)]">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"/>
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100"/>
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="text-red-500 mb-4">{error}</div>
                  <button 
                    onClick={() => fetchConversations()}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 
                             transition-colors duration-200"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(activeTab === 'recent' ? filteredConversations : history).map(conv => {
                    const otherName = conv.senderId === user.id ? conv.receiverName : conv.senderName;
                    const isSelected = selectedConversation?.id === conv.id;
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 text-left transition-all duration-200
                          ${isSelected 
                            ? 'bg-purple-50 border-l-4 border-l-purple-500' 
                            : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 
                                        rounded-full flex items-center justify-center text-white font-bold">
                            {otherName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{otherName}</p>
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                              {conv.senderId === user.id && 
                                <span className="text-purple-500 font-medium">You: </span>}
                              {conv.content}
                            </p>
                          </div>
                          {!conv.isRead && conv.receiverId === user.id && (
                            <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"/>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="col-span-2 p-6 flex flex-col h-[80vh] bg-gradient-to-br from-gray-50 to-white">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="pb-4 mb-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedConversation.senderId === user.id 
                      ? selectedConversation.receiverName 
                      : selectedConversation.senderName}
                  </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl shadow-sm
                          ${message.senderId === user.id
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : 'bg-white border border-gray-100'}`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.senderId === user.id ? 'You' : message.senderName}
                        </p>
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p className={`text-xs mt-2 ${message.senderId === user.id 
                          ? 'text-white/75' 
                          : 'text-gray-500'}`}>
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             bg-white/50 backdrop-blur-sm transition-all duration-200"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 
                             text-white rounded-lg hover:from-purple-600 hover:to-blue-600 
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                        </svg>
                        Send
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Messages</h3>
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;