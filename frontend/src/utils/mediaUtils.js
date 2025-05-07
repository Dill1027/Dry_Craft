import axiosInstance from './axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const PLACEHOLDER_IMAGE = `${API_BASE_URL}/images/placeholder-image.png`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const getMediaUrl = async (mediaId, originalUrl, options = {}) => {
  const retryCount = options.retryCount || 0;
  const signal = options.signal || new AbortController().signal;
  
  try {
    const response = await axiosInstance.loadMedia(mediaId, {
      ...options,
      signal,
      timeout: options.timeout || 10000,
      retries: retryCount,
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

    console.error(`Media load error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

    if (retryCount < MAX_RETRIES && !signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
      return getMediaUrl(mediaId, originalUrl, {
        ...options,
        retryCount: retryCount + 1,
        signal
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
