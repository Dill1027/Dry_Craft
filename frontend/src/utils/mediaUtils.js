import axiosInstance from './axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const PLACEHOLDER_IMAGE = `${API_BASE_URL}/images/placeholder-image.png`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const getMediaUrl = async (mediaId, originalUrl, retryCount = 0) => {
  try {
    const response = await axiosInstance.loadMedia(mediaId, {
      timeout: 10000, // 10 second timeout
      retries: retryCount,
      onDownloadProgress: (progressEvent) => {
        console.log(`Loading ${mediaId}: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
      }
    });

    if (!response.data) {
      throw new Error('Empty response');
    }

    return URL.createObjectURL(response.data);

  } catch (error) {
    console.error(`Media load error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
      return getMediaUrl(mediaId, originalUrl, retryCount + 1);
    }

    if (originalUrl) {
      console.warn(`Using fallback URL for ${mediaId}`);
      return getFullUrl(originalUrl);
    }

    return error.response?.status === 404 ? PLACEHOLDER_IMAGE : null;
  }
};

const handleImageError = (url) => {
  console.warn(`Image failed to load: ${url}`);
  return PLACEHOLDER_IMAGE;
};

const getFullUrl = (url) => {
  if (!url) return PLACEHOLDER_IMAGE;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

export { getMediaUrl, handleImageError, getFullUrl };
