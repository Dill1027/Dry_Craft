const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

export const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};
