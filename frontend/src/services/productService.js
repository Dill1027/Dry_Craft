import axios from 'axios';

const API_URL = 'http://localhost:8081/api/products';

export const getAllProducts = () => axios.get(API_URL);

export const updateProduct = (id, product) => axios.put(`${API_URL}/${id}`, product);
export const deleteProduct = (id) => axios.delete(`${API_URL}/${id}`);
export const createProduct = (formData) =>
    axios.post('http://localhost:8081/api/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  
