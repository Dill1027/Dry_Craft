export const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/${cleanPath}`;
};

export const handleMediaError = (error, entityId) => {
  console.error(`Media error for ${entityId}:`, error);
  return '/images/fallback-product.png';
};
