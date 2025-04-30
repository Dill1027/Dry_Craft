import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getFullUrl } from '../../utils/apiUtils';

const categories = {
  'Greeting Cards': ['Birthday Card', 'Wedding Card', 'Thank You Card', 'Holiday Card'],
  'Scrapbooking': ['Border Design', 'Flower Pattern', 'Frame Design', 'Corner Design'],
  'Leather Work': ['Keychain', 'Wallet', 'Bag Handle', 'Card Holder'],
  'Jewelry': ['Pendant', 'Charm', 'Earring', 'Bracelet'],
  'Fabric Crafts': ['Quilt Pattern', 'Applique Design', 'Embroidery Pattern', 'Patchwork'],
  'Decorations': ['Paper Flower', 'Banner', 'Garland', 'Wall Decor'],
  'Gift Wrapping': ['Gift Tag', 'Gift Box', 'Bow Design', 'Wrapper Pattern']
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/products');
      const productsWithMedia = await Promise.all(
        res.data.map(async (product) => {
          if (product.imageUrl) {
            try {
              const fullUrl = await getMediaUrl(product.imageUrl);
              return { ...product, imageUrl: fullUrl };
            } catch (error) {
              console.log(`Media load error for ${product.id}:`, error);
              return { ...product, imageUrl: '/images/fallback-product.png' };
            }
          }
          return product;
        })
      );
      setProducts(productsWithMedia);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = async (url, attempts = 3) => {
    for (let i = 0; i < attempts; i++) {
      try {
        if (url.startsWith('http')) return url;
        const fullUrl = getFullUrl(url);
        await validateImage(fullUrl);
        return fullUrl;
      } catch (error) {
        console.log(`Media load error (attempt ${i + 1}/${attempts}):`, error);
        if (i === attempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  };

  const validateImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });
  };

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    subCategory: '',
    colors: [],
    sellerId: '',
    images: ['', '', '', '']
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'colors') {
      setForm({ ...form, colors: value.split(',').map(c => c.trim()) });
    } else if (name.startsWith('image')) {
      const index = parseInt(name.replace('image', ''));
      const newImages = [...form.images];
      newImages[index] = value;
      setForm({ ...form, images: newImages });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:8081/api/products', form);
    fetchProducts();
    setForm({ name: '', description: '', price: '', stock: '', category: '', subCategory: '', colors: [], sellerId: '', images: ['', '', '', ''] });
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8081/api/products/${id}`);
    fetchProducts();
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">DIY Craft Marketplace</h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 
                     focus:ring-purple-500 focus:border-transparent pl-10"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8 space-y-4">
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        >
          <option value="">Select Category</option>
          {Object.keys(categories).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {form.category && (
          <select
            name="subCategory"
            value={form.subCategory}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          >
            <option value="">Select Sub-Category</option>
            {categories[form.category].map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        )}

        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        />

        {form.images.map((url, index) => (
          <input
            key={index}
            name={`image${index}`}
            placeholder={`Image URL ${index + 1}`}
            value={url}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
        ))}

        <input
          name="colors"
          placeholder="Colors (comma-separated)"
          value={form.colors.join(', ')}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        />

        <input
          name="stock"
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
        />

        <button
          type="submit"
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Add Product
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-gray-600 mt-1">{product.description}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-purple-600 font-bold">${product.price}</span>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-full 
                             hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;