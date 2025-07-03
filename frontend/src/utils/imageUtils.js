const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const MEDIA_URL = process.env.REACT_APP_MEDIA_URL || `${API_BASE_URL}/api/media`;

export const getImageUrl = (url) => {
    if (!url) return '/images/placeholder.jpg';
    
    try {
        // If URL is already absolute
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // If URL is a relative path starting with /api/
        if (url.startsWith('/api/')) {
            return `${API_BASE_URL}${url}`;
        }
        
        // If URL is a media ID (for Azure storage)
        if (url.match(/^[0-9a-fA-F]{24}$/)) {
            return `${MEDIA_URL}/${url}`;
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

// Add function to determine if we're running in production environment
export const isProductionEnvironment = () => {
    return process.env.REACT_APP_API_URL?.includes('vercel.app') || false;
};
