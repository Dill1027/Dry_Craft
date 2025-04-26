// src/components/AddProduct.js
import React, { useState } from 'react';
import { createProduct } from '../../services/productService';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    color: ''
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setProduct({ ...product, [e.target.name]: value });
  };

  const handleImageChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (image) formData.append('image', image);

      await createProduct(formData);
      navigate('/productlist');
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.response?.data?.message || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <Card.Title>Add New Craft Product</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit} encType="multipart/form-data">
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={product.name} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control name="description" value={product.description} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" name="price" value={product.price} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control type="number" name="stock" value={product.stock} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <Form.Control name="color" value={product.color} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Adding Product...' : 'Add Product'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddProduct;
