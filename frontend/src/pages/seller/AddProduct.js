// src/components/AddProduct.js
import React, { useState, useEffect } from 'react';
import { createProduct } from '../../services/productService';
import { useNavigate } from 'react-router-dom';

const categories = {
  'Greeting Cards': ['Birthday Card', 'Wedding Card', 'Thank You Card', 'Holiday Card'],
  'Scrapbooking': ['Border Design', 'Flower Pattern', 'Frame Design', 'Corner Design'],
  'Leather Work': ['Keychain', 'Wallet', 'Bag Handle', 'Card Holder'],
  'Jewelry': ['Pendant', 'Charm', 'Earring', 'Bracelet'],
  'Fabric Crafts': ['Quilt Pattern', 'Applique Design', 'Embroidery Pattern', 'Patchwork'],
  'Decorations': ['Paper Flower', 'Banner', 'Garland', 'Wall Decor'],
  'Gift Wrapping': ['Gift Tag', 'Gift Box', 'Bow Design', 'Wrapper Pattern']
};

const MAX_IMAGES = 4;

const AddProduct = () => {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    colors: [],
    category: '',
    subCategory: '',
    sellerId: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      setProduct(prev => ({
        ...prev,
        sellerId: user.id
      }));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'colors') {
      setProduct({ 
        ...product, 
        colors: value.split(',').map(color => color.trim()).filter(color => color !== '')
      });
    } else {
      const processedValue = e.target.type === 'number' ? parseFloat(value) : value;
      setProduct({ ...product, [name]: processedValue });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - images.length;
    const newFiles = files.slice(0, remainingSlots);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!product.sellerId) {
      setError('Seller ID is required. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item));
        } else if (value) {
          formData.append(key, value);
        }
      });
      
      images.forEach(image => {
        formData.append('images', image);
      });

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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              name="description"
              value={product.description}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              value={product.stock}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
            <input
              type="text"
              name="colors"
              value={product.colors.join(', ')}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter colors separated by commas (e.g., Red, Blue, Green)"
              required
            />
            {product.colors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((color, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                  >
                    {color}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={product.category}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Category</option>
              {Object.keys(categories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {product.category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Category</label>
              <select
                name="subCategory"
                value={product.subCategory}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Sub-Category</option>
                {categories[product.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Images ({images.length}/{MAX_IMAGES})
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              disabled={images.length >= MAX_IMAGES}
            />
            {imagePreviewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
