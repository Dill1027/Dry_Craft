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

export const replyToMessage = (messageId, replyContent) => {
  return axiosInstance.post(`/api/messages/${messageId}/reply`, { replyContent });
};

export const getBuyerMessages = (buyerId) => {
  return axiosInstance.get(`/api/messages/buyer/${buyerId}`);
};
