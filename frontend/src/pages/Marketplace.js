import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const categories = [
  {
    name: "Greeting Cards",
    description: "Intricate paper cut-out cards",
    icon: "🎴"
  },
  {
    name: "Scrapbooking",
    description: "Fancy borders, flowers, frames",
    icon: "📒"
  },
  {
    name: "Leather Work",
    description: "Keychains, wallets, bag parts",
    icon: "👝"
  },
  {
    name: "Jewelry",
    description: "Metal cutout pendants, charms",
    icon: "💍"
  },
  {
    name: "Fabric Crafts",
    description: "Applique shapes for quilts",
    icon: "🧵"
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Craft Marketplace</h1>
          <button
            onClick={() => navigate('/addproducts')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                     transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Sell Product
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 
                           focus:ring-purple-500 focus:border-transparent"
                />
                <svg
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 
                         hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {selectedCategory || 'All Categories'}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute z-10 w-72 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50 rounded-md"
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
                        className="w-full px-4 py-2 text-left hover:bg-purple-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <div>
                            <div className="font-medium">{category.name}</div>
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

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="w-full h-48">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-purple-600 font-bold">${product.price}</span>
                    <button 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                    >
                      View Details
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
