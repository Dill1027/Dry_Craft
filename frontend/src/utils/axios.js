import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8081",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 60000, // Increased to 1 minute for general requests
});

// Add helper function to get full URL
axiosInstance.getFullUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8081";
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

// Update request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      
      // Add auth headers for all requests
      if (user?.email && user?.rawPassword) {
        const credentials = btoa(`${user.email}:${user.rawPassword}`);
        config.headers.Authorization = `Basic ${credentials}`;
      }

      // Special handling for media requests
      if (config.url?.includes("/api/media/")) {
        config.responseType = 'blob';
        config.headers = {
          ...config.headers,
          Accept: '*/*',
          'Cache-Control': 'no-cache'
        };
      }

      return config;
    } catch (error) {
      console.error("Auth error:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Update response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response;
    }
    return response;
  },
  (error) => {
    let errorMessage = error.message || "An error occurred";
    
    // Handle CORS errors
    if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
      console.warn('CORS or Network Error:', error);
      // For aitopia.ai requests, try with no-cors mode
      if (error.config?.url?.includes('aitopia.ai')) {
        return fetch(error.config.url, {
          method: error.config.method,
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: error.config.data
        }).catch(err => {
          console.error('Fallback request failed:', err);
          throw err;
        });
      }
    }

    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || errorMessage;
      
      // Don't redirect for 'User not found' errors on public endpoints
      if (error.response.status === 403 && 
          !error.config.url.endsWith('/posts') && 
          !error.config.url.includes('/media/')) {
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Add cleanup utility 
axiosInstance.revokeObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// Simplified upload method with chunking and retry logic
axiosInstance.uploadMedia = async (url, formData, options = {}) => {
  const method = options.method || 'POST';
  const maxRetries = options.retries || 3;
  let attempt = 0;

  const upload = async () => {
    try {
      return await axiosInstance({
        url,
        method,
        data: formData,
        timeout: options.timeout || 300000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          ...options.headers
        },
        transformRequest: [(data, headers) => {
          // Remove charset from content-type
          if (headers['Content-Type']?.includes('charset')) {
            headers['Content-Type'] = 'multipart/form-data';
          }
          return data;
        }],
        ...options,
        onUploadProgress: options.onUploadProgress
      });
    } catch (error) {
      if (attempt < maxRetries && (
        error.code === 'ECONNRESET' || 
        error.code === 'ERR_NETWORK' ||
        error.response?.status === 415
      )) {
        attempt++;
        console.log(`Upload retry attempt ${attempt} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        return upload();
      }
      throw error;
    }
  };

  return upload();
};

// Add new method for interaction requests with shorter timeout
axiosInstance.interact = (url, method = 'POST', data = null, params = null) => {
  return axiosInstance({
    url,
    method,
    data,
    params,
    timeout: 10000, // 10 second timeout for interactions
    retries: 2, // Allow 2 retries for interaction requests
  });
};

// Add new method for media loading with optimized configuration
axiosInstance.loadMedia = (mediaId, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  return axiosInstance({
    url: `/api/media/${mediaId}`,
    method: 'GET',
    responseType: 'blob',
    signal: controller.signal,
    ...options,
    headers: {
      ...options.headers,
      'Accept': '*/*',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    onDownloadProgress: (progressEvent) => {
      if (options.onDownloadProgress) {
        options.onDownloadProgress(progressEvent);
      }
      // Reset timeout on progress
      clearTimeout(timeoutId);
      setTimeout(() => controller.abort(), options.timeout || 30000);
    }
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Add profile picture upload method with optimized configuration
axiosInstance.uploadProfilePicture = async (userId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  return axiosInstance({
    url: `/api/users/${userId}/profile-picture`,
    method: 'PUT',
    data: formData,
    timeout: 60000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export default axiosInstance;
