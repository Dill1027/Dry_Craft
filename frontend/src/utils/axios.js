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
          Authorization: config.headers.Authorization, // Keep auth header
          Accept: '*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest'
        };
      }

      return config;
    } catch (error) {
      console.error("Auth error:", error);
      return config;
    }
  },
  (error) => Promise.reject(new Error(error.message))
);

// Update response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      // Don't transform blob responses
      return response;
    }
    return response;
  },
  (error) => {
    // Convert to proper Error object
    const errorMessage = error.response?.data?.message || error.message || 'Network error';
    if (error.code === "ERR_NETWORK") {
      console.error("Network Error - Backend may be down:", error);
      // Add retry logic for media requests
      if (error.config?.url?.includes("/api/media/")) {
        const retryConfig = {
          ...error.config,
          retry: (error.config.retry || 0) + 1,
        };
        if (retryConfig.retry <= 3) {
          return new Promise(resolve => setTimeout(resolve, 1000))
            .then(() => axiosInstance.request(retryConfig));
        }
      }
    } else if (error.response?.status === 403) {
      console.error("Authentication error:", error);
      localStorage.removeItem("user");
      window.location.href = "/login";
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

// Add new method for media uploads with custom timeout
axiosInstance.uploadMedia = (url, data, options = {}) => {
  return axiosInstance({
    url,
    method: 'POST',
    data,
    timeout: 300000, // Increased to 5 minutes for large uploads
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...options,
  });
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
  return axiosInstance({
    url: `/api/media/${mediaId}`,
    method: 'GET',
    responseType: 'blob',
    timeout: 30000, // 30 second timeout
    headers: {
      'Accept': 'image/*, video/*',
      'Range': 'bytes=0-',
      'Cache-Control': 'no-cache'
    },
    // Add retry configuration
    retries: 3,
    retryDelay: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000),
    ...options,
  });
};

export default axiosInstance;
