import axiosInstance from './axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const PLACEHOLDER_IMAGE = `${API_BASE_URL}/images/placeholder-image.png`;
const MAX_RETRIES = 5; // Increased from 3
const INITIAL_TIMEOUT = 60000; // Increased to 60 seconds
const RETRY_DELAY = 2000; // Increased from 1000

const getMediaUrl = async (mediaId, originalUrl, options = {}) => {
  const retryCount = options.retryCount || 0;
  const signal = options.signal || new AbortController().signal;
  const timeout = options.timeout || INITIAL_TIMEOUT;
  
  try {
    console.log(`Attempting to load media ${mediaId} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    
    const response = await axiosInstance.loadMedia(mediaId, {
      signal,
      timeout,
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (options.onProgress) {
          options.onProgress(progressEvent);
        }
      }
    });

    if (!response.data) {
      throw new Error('Empty response');
    }

    return URL.createObjectURL(response.data);

  } catch (error) {
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      console.warn(`Media load canceled for ${mediaId}`);
      return originalUrl ? getFullUrl(originalUrl) : PLACEHOLDER_IMAGE;
    }

    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    console.error(`Media load error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, {
      mediaId,
      error: error.message,
      isTimeout,
      retryCount
    });

    if (retryCount < MAX_RETRIES && !signal.aborted) {
      const jitter = Math.random() * 2000; // Increased jitter range
      const delay = (RETRY_DELAY * Math.pow(1.5, retryCount)) + jitter; // Changed exponential base to 1.5
      console.log(`Retrying in ${Math.round(delay/1000)}s with timeout: ${timeout}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return getMediaUrl(mediaId, originalUrl, {
        ...options,
        retryCount: retryCount + 1,
        signal,
        timeout: Math.min(timeout * 1.5, 120000) // Cap max timeout at 120 seconds
      });
    }

    return originalUrl ? getFullUrl(originalUrl) : PLACEHOLDER_IMAGE;
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
