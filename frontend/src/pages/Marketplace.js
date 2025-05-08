import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { getFullUrl } from '../utils/apiUtils';

const categories = [
  {
    name: "Greeting Cards",
    description: "Intricate paper cut-out cards",
    icon: "🎴",
    gradient: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50"
  },
  {
    name: "Scrapbooking",
    description: "Fancy borders, flowers, frames",
    icon: "📒",
    gradient: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50"
  },
  {
    name: "Leather Work",
    description: "Keychains, wallets, bag parts",
    icon: "👝",
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50"
  },
  {
    name: "Jewelry",
    description: "Metal cutout pendants, charms",
    icon: "💍",
    gradient: "from-purple-500 to-violet-500",
    bgLight: "bg-purple-50"
  },
  {
    name: "Fabric Crafts",
    description: "Applique shapes for quilts",
    icon: "🧵",
    gradient: "from-teal-500 to-emerald-500",
    bgLight: "bg-teal-50"
  },
  {
    name: "Decorations",
    description: "Paper flowers, banners, garlands",
    icon: "🎊"
  },
  {
    name: "Gift Wrapping",
    description: "Handmade tags, boxes, bows",
    icon: "🎁"
  }
];

function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const navigate = useNavigate();

  const defaultProductImage = '/images/placeholder-image.jpg';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      const response = await axiosInstance.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message === 'Network Error' 
        ? 'Unable to connect to server. Please check your connection and try again.'
        : 'Failed to load products. Please try again later.');
      setProducts([]); // Reset products on error
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchProducts();
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Craft Marketplace
            </h1>
            <p className="text-gray-600 mt-2">Discover unique handmade crafts</p>
          </div>
          <button
            onClick={() => navigate('/addproducts')}
            className="group px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg 
                     hover:from-purple-700 hover:to-blue-700 transform hover:-translate-y-0.5 
                     transition-all duration-200 shadow-md hover:shadow-xl"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 transition-transform group-hover:rotate-180 duration-300" 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Sell Product
            </span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-white p-6 rounded-lg shadow-md inline-block">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-800 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                         transition-colors flex items-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filter Section */}
        {!error && (
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-white/20">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 pl-12
                             focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             transition-all duration-200 bg-white/50"
                  />
                  <svg
                    className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 transition-colors duration-200
                             group-hover:text-purple-500"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>

              {/* Enhanced Category Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 rounded-lg 
                           flex items-center gap-3 hover:border-purple-500 focus:outline-none 
                           focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                >
                  <span className="text-gray-700">{selectedCategory || 'All Categories'}</span>
                  <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 
                                ${showCategoryDropdown ? 'rotate-180' : ''}`}
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {/* Category Menu with Enhanced UI */}
                {showCategoryDropdown && (
                  <div className="absolute z-10 w-72 mt-2 p-2 bg-white border border-gray-100 rounded-xl 
                                shadow-xl animate-fade-in-down">
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg 
                                 transition-colors duration-150"
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.name}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left rounded-lg transition-all duration-200
                                    hover:scale-[1.02] ${category.bgLight} hover:shadow-md`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl transform transition-transform duration-200 
                                         hover:scale-110">{category.icon}</span>
                            <div>
                              <div className={`font-medium bg-gradient-to-r ${category.gradient} 
                                            bg-clip-text text-transparent`}>
                                {category.name}
                              </div>
                              <div className="text-sm text-gray-500">{category.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} 
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl 
                         transform hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-w-16 aspect-h-12 bg-gray-100">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <div className="relative h-full overflow-hidden group">
                      <img
                        src={getFullUrl(product.imageUrls[0], 'product')}
                        alt={product.name}
                        className="w-full h-full object-cover transform transition-transform duration-700 
                                 group-hover:scale-110"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultProductImage;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent 
                                    opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <img 
                        src={defaultProductImage}
                        alt="No image available"
                        className="w-20 h-20 object-contain opacity-40"
                      />
                    </div>
                  )}
                  {/* Stock Status Badges */}
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm 
                                  text-white text-xs font-medium rounded-full shadow-lg">
                      Only {product.stock} left!
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm 
                                  text-white text-xs font-medium rounded-full shadow-lg">
                      Out of Stock
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-800 
                                   text-xs font-medium rounded-full shadow-lg">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 
                               transition-colors duration-200 line-clamp-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="space-y-1">
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 
                                     bg-clip-text text-transparent">${product.price}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 
                               transition-all duration-200 font-medium text-sm flex items-center gap-2
                               hover:gap-3"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
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

export default Marketplace;
