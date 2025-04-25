// src/components/AddProduct.js
import React, { useState } from 'react';
import { createProduct } from '../../services/productService';
import { Container, Form, Button, Card } from 'react-bootstrap';

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    color: ''
  });
  const [image, setImage] = useState(null);

  const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

  const handleImageChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(product).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (image) formData.append('image', image);

    await createProduct(formData); // This should handle FormData in your service
    setProduct({ name: '', description: '', price: '', stock: '', color: '' });
    setImage(null);
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <Card.Title>Add New Craft Product</Card.Title>
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

            <Button type="submit" variant="primary">Add Product</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddProduct;
