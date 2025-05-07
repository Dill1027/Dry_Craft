import axiosInstance from '../utils/axios';

export const sendMessage = (sellerId, buyerId, productId, content) => {
  return axiosInstance.post('/api/messages', {
    sellerId,
    buyerId,
    productId,
    content
  });
};

export const getSellerMessages = (sellerId) => {
  return axiosInstance.get(`/api/messages/seller/${sellerId}`);
};

export const getUnreadMessages = (sellerId) => {
  return axiosInstance.get(`/api/messages/unread/${sellerId}`);
};

export const markMessageAsRead = (messageId) => {
  return axiosInstance.put(`/api/messages/${messageId}/read`);
};

export const replyToMessage = (messageId, content) => {
  return axiosInstance.post(`/api/messages/reply/${messageId}`, { content });
};

export const getConversation = (userId1, userId2) => {
  return axiosInstance.get(`/api/messages/conversation/${userId1}/${userId2}`);
};

export const getUserMessages = (userId) => {
  return axiosInstance.get(`/api/messages/user/${userId}`);
};
