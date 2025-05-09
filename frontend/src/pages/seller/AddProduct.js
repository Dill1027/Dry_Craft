// src/components/AddProduct.js
import React, { useState, useEffect } from 'react';
import { createProduct } from '../../services/productService';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

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

    // Validate file types and sizes
    const invalidFile = newFiles.find(file => !file.type.startsWith('image/'));
    if (invalidFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Type',
        text: 'Please upload only image files',
        confirmButtonColor: '#9333EA'
      });
      return;
    }

    const oversizedFile = newFiles.find(file => file.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'Each image must be less than 5MB',
        confirmButtonColor: '#9333EA'
      });
      return;
    }

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
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please log in to add a product',
        confirmButtonColor: '#9333EA'
      });
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
      
      Swal.fire({
        icon: 'success',
        title: 'Product Added Successfully!',
        text: 'Your product has been added to the marketplace',
        confirmButtonColor: '#9333EA',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      }).then(() => {
        navigate('/products');
      });

    } catch (err) {
      console.error('Error adding product:', err);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Add Product',
        text: err.response?.data?.message || 'Something went wrong. Please try again.',
        confirmButtonColor: '#9333EA'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Add New Product
              </h2>
              <p className="text-gray-600 mt-2">Fill in the details for your new craft product</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 
                             focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 
                             focus:border-transparent transition-colors bg-gray-50 hover:bg-white resize-none"
                    placeholder="Describe your product"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={product.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 
                               focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={product.stock}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 
                               focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category and Colors */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 
                             focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Category</label>
                    <select
                      name="subCategory"
                      value={product.subCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 
                               focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                  <input
                    type="text"
                    name="colors"
                    value={product.colors.join(', ')}
                    onChange={handleChange}
                    placeholder="Red, Blue, Green"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 
                             focus:border-transparent transition-colors bg-gray-50 hover:bg-white"
                  />
                  {product.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {product.colors.map((color, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images ({images.length}/{MAX_IMAGES})
              </label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg 
                            hover:border-purple-500 transition-colors">
                <div className="space-y-2 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium 
                                                          text-purple-600 hover:text-purple-500 focus-within:outline-none">
                      <span>Upload images</span>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="sr-only"
                        disabled={images.length >= MAX_IMAGES}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              </div>

              {imagePreviewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-w-1 aspect-h-1">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 
                                 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
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

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                         hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 
                         focus:ring-purple-500 focus:ring-offset-2 transform transition-all duration-200
                         hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:hover:scale-100 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Adding Product...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
