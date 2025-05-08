import axiosInstance from '../utils/axios';

const DEFAULT_TIMEOUT = 15000;
const LONG_TIMEOUT = 30000;
const MAX_RETRIES = 2;

const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('Invalid user ID provided');
  }
  return userId.trim();
};

export const sendMessage = (sellerId, buyerId, productId, content) => {
  return axiosInstance.post('/api/messages', {
    sellerId,
    buyerId,
    productId,
    content
  }, { timeout: DEFAULT_TIMEOUT });
};

export const getSellerMessages = (sellerId) => {
  return axiosInstance.get(`/api/messages/seller/${sellerId}`, { timeout: DEFAULT_TIMEOUT });
};

export const getUnreadMessages = (sellerId) => {
  return axiosInstance.get(`/api/messages/unread/${sellerId}`);
};

export const markMessageAsRead = (messageId) => {
  return axiosInstance.put(`/api/messages/${messageId}/read`);
};

export const replyToMessage = (messageId, replyContent) => {
  return axiosInstance.post(`/api/messages/${messageId}/reply`, { replyContent });
};

export const getConversation = async (userId1, userId2, retryCount = 0) => {
  try {
    const response = await axiosInstance.get(
      `/api/messages/conversation/${userId1}/${userId2}`,
      { timeout: DEFAULT_TIMEOUT }
    );
    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES && error.code === 'ECONNABORTED') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getConversation(userId1, userId2, retryCount + 1);
    }
    throw error;
  }
};

export const getUserMessages = async (userId, retryCount = 0) => {
  try {
    const validUserId = validateUserId(userId);
    const response = await axiosInstance.get(`/api/messages/user/${validUserId}`, {
      timeout: DEFAULT_TIMEOUT
    });
    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES && error.code === 'ECONNABORTED') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getUserMessages(userId, retryCount + 1);
    }
    throw error;
  }
};

export const getGroupedConversations = async (userId, searchQuery = '') => {
  try {
    const validUserId = validateUserId(userId);
    const response = await axiosInstance.get(`/api/messages/conversations/${validUserId}`, {
      params: { search: searchQuery },
      timeout: DEFAULT_TIMEOUT
    });

    return { 
      data: response.data || [],
      status: response.status 
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { data: [], status: 404 };
    }
    console.error('Error fetching conversations:', error);
    return { data: [], status: error.response?.status || 500 };
  }
};

export const getBuyerMessages = (buyerId) => {
  return axiosInstance.get(`/api/messages/buyer/${buyerId}`);
};
