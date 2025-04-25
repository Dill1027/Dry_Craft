import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', color: '', sellerId: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:8081/api/products');
    setProducts(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:8081/api/products', form);
    fetchProducts();
    setForm({ name: '', description: '', price: '', stock: '', color: '', sellerId: '' });
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8081/api/products/${id}`);
    fetchProducts();
  };

  return (
    <div className="App">
      <h1>DIY Craft Marketplace</h1>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} />
        <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} />
        <input name="color" placeholder="Color" value={form.color} onChange={handleChange} />
        <input name="sellerId" placeholder="Seller ID" value={form.sellerId} onChange={handleChange} />
        <button type="submit">Add Product</button>
      </form>

      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - {product.description} - ${product.price}
            <button onClick={() => handleDelete(product.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;