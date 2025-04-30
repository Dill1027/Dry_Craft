import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, deleteProduct, updateProduct } from '../../services/productService';
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
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editImages, setEditImages] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const navigate = useNavigate();
  const MAX_IMAGES = 4;

  useEffect(() => {
    fetchSellerProducts();
  }, [user?.id]);

  const fetchSellerProducts = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      const response = await getAllProducts();
      const sellerProducts = response.data.filter(product => product.sellerId === user.id);
      setProducts(sellerProducts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setEditImagePreviews(product.imageUrls || []);
    setShowEditModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = MAX_IMAGES - editImagePreviews.length;
    const newFiles = files.slice(0, remainingSlots);

    // Validate file types and sizes
    const invalidFile = newFiles.find(file => !file.type.startsWith('image/'));
    if (invalidFile) {
      setError('Please upload only image files');
      return;
    }

    const oversizedFile = newFiles.find(file => file.size > 5 * 1024 * 1024);
    if (oversizedFile) {
      setError('Each image must be less than 5MB');
      return;
    }

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setEditImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setEditImages(prev => [...prev, ...newFiles]);
  };

  const removeImage = (indexToRemove) => {
    setEditImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    setEditImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const formData = new FormData();
      const productData = {
        ...currentProduct,
        imageUrls: editImagePreviews.filter(url => !url.startsWith('data:'))
      };

      formData.append('product', JSON.stringify(productData));
      
      editImages.forEach(image => {
        formData.append('images', image);
      });

      const response = await updateProduct(currentProduct.id, formData);
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === currentProduct.id ? response.data : p)
      );
      
      setShowEditModal(false);
      setEditImages([]);
      setEditImagePreviews([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' 
        ? Number(value)
        : name === 'colors'
          ? value.split(',').map(color => color.trim()).filter(Boolean)
          : value
    }));
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(product => product.id !== id));
      } catch (err) {
        setError('Failed to delete product');
        console.error(err);
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            <p className="mt-2 text-gray-600">Manage your craft products</p>
          </div>
          <button
            onClick={() => navigate('/addproducts')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 
                     text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all 
                     duration-300 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search your products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:ring-2 
                       focus:ring-green-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Product</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={currentProduct?.name || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={currentProduct?.description || ''}
                    onChange={handleEditChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={currentProduct?.price || ''}
                      onChange={handleEditChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={currentProduct?.stock || ''}
                      onChange={handleEditChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Colors</label>
                  <input
                    type="text"
                    name="colors"
                    value={currentProduct?.colors?.join(', ') || ''}
                    onChange={handleEditChange}
                    placeholder="Enter colors separated by commas"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    value={currentProduct?.category || ''}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Category</option>
                    {Object.keys(categories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {currentProduct?.category && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sub-Category</label>
                    <select
                      name="subCategory"
                      value={currentProduct?.subCategory || ''}
                      onChange={handleEditChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Sub-Category</option>
                      {categories[currentProduct.category]?.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Image upload section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Images ({editImagePreviews.length}/{MAX_IMAGES})
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                             file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 
                             file:text-blue-700 hover:file:bg-blue-100"
                    disabled={editImagePreviews.length >= MAX_IMAGES}
                  />
                </div>

                {/* Image previews */}
                {editImagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {editImagePreviews.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url.startsWith('data:') ? url : getFullUrl(url)}
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

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-red-800">{error}</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-48">
                  <img
                    src={product.imageUrls?.[0] || '/placeholder-image.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">${product.price}</span>
                    <span className="text-sm text-gray-500">{product.stock} in stock</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;