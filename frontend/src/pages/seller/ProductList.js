// src/components/ProductList.js
import React, { useEffect, useState } from 'react';
import { getAllProducts, deleteProduct, updateProduct } from '../../services/productService';
import { Container, Row, Col, Card, Button, Form, Modal } from 'react-bootstrap';
import { getFullUrl } from '../../utils/apiUtils';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    color: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await getAllProducts();
      setProducts(res.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateProduct(currentProduct.id, currentProduct);
    setShowEditModal(false);
    fetchProducts();
  };

  return (
    <Container className="mt-4">
      <h2 className="text-center mb-4">Craft Products</h2>
      <Row>
        {products.map((product) => (
          <Col key={product.id} md={4} sm={6} xs={12} className="mb-4">
            <Card className="h-100 shadow-sm">
              {product.imageUrl && (
                <Card.Img
                  variant="top"
                  src={getFullUrl(product.imageUrl)}
                  alt={product.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
              )}
              <Card.Body className="d-flex flex-column">
                <Card.Title>{product.name}</Card.Title>
                <Card.Text className="flex-grow-1">
                  {product.description}
                </Card.Text>
                <h5 className="mb-3">${product.price}</h5>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleEditClick(product)}
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(product.id)}
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentProduct.name}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={currentProduct.description}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={currentProduct.price}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control
                type="number"
                name="stock"
                value={currentProduct.stock}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="text"
                name="color"
                value={currentProduct.color}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success">
              Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default ProductList;
