const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

export const getImageUrl = (url) => {
    if (!url) return '/images/placeholder.jpg';
    
    try {
        // If URL is already absolute
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // If URL is a relative path starting with /api/
        if (url.startsWith('/api/')) {
            return `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}${url}`;
        }
        
        // For relative paths not starting with /api/
        return `/images/${url}`;
    } catch (error) {
        console.error('Error formatting image URL:', error);
        return '/images/placeholder.jpg';
    }
};

export const handleImageError = (url, fallbackUrl = '/images/placeholder.jpg') => {
    // Log error for debugging
    console.warn('Image failed to load:', url);
    return fallbackUrl;
};
