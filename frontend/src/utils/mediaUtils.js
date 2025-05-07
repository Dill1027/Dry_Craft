import axiosInstance from './axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const PLACEHOLDER_IMAGE = `${API_BASE_URL}/images/placeholder-image.png`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000; // 30 seconds

const getMediaUrl = async (mediaId, originalUrl, options = {}) => {
  const retryCount = options.retryCount || 0;
  const signal = options.signal || new AbortController().signal;
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  
  try {
    console.log(`Attempting to load media ${mediaId} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    
    const response = await axiosInstance.loadMedia(mediaId, {
      signal,
      timeout: timeout * (retryCount + 1), // Progressive timeout increase
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

    // Add exponential backoff with jitter
    if (retryCount < MAX_RETRIES && !signal.aborted) {
      const jitter = Math.random() * 1000;
      const delay = (RETRY_DELAY * Math.pow(2, retryCount)) + jitter;
      console.log(`Retrying in ${Math.round(delay/1000)}s with timeout: ${timeout * (retryCount + 2)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getMediaUrl(mediaId, originalUrl, {
        ...options,
        retryCount: retryCount + 1,
        signal,
        timeout: timeout * (retryCount + 2)
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
