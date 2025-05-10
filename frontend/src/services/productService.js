import axiosInstance from '../utils/axios';

const API_URL = '/api/products';

export const getAllProducts = () => axiosInstance.get(API_URL);

export const createProduct = (formData) => {
  return axiosInstance.uploadMedia(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const updateProduct = async (id, formData) => {
  return axiosInstance.put(`${API_URL}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteProduct = (id) => axiosInstance.delete(`${API_URL}/${id}`);

export const getProductById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};