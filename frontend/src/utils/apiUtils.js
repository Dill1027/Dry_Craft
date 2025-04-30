const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

// Define placeholder images for different types
const PLACEHOLDERS = {
  product: '/images/placeholder-image.jpg',
  profile: '/images/default-avatar.png',
  post: '/images/placeholder-post.jpg',
  default: '/images/placeholder-image.jpg'
};

export const getPlaceholderImage = (type = 'default') => {
  return PLACEHOLDERS[type] || PLACEHOLDERS.default;
};

export const getFullUrl = (path, type = 'default') => {
  if (!path) return getPlaceholderImage(type);
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('/images/')) return path;
  
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const handleImageError = (error, type = 'default') => {
  console.error('Image loading error:', error);
  return getPlaceholderImage(type);
};
