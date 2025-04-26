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

export const updateProduct = (id, product) => axiosInstance.put(`${API_URL}/${id}`, product);
export const deleteProduct = (id) => axiosInstance.delete(`${API_URL}/${id}`);

