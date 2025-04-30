import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { getFullUrl } from '../utils/apiUtils';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProductById(id);
        const productData = response.data;

        // Transform image URLs to full URLs
        if (productData.imageUrls) {
          productData.imageUrls = productData.imageUrls.map(url => getFullUrl(url));
        }

        setProduct(productData);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-purple-600 hover:text-purple-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Images Section */}
            <div className="md:w-1/2 p-6">
              <div className="relative aspect-w-4 aspect-h-3 mb-4">
                <img
                  src={product.imageUrls[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
              {/* Thumbnail Images */}
              <div className="flex gap-2 mt-4">
                {product.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                      ${currentImageIndex === index ? 'border-purple-500' : 'border-transparent'}`}
                  >
                    <img src={url} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info Section */}
            <div className="md:w-1/2 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-4xl font-bold text-purple-600 mb-6">${product.price}</p>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                  <p className="text-gray-600 mt-1">{product.description}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Category</h2>
                  <p className="text-gray-600 mt-1">{product.category} - {product.subCategory}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Available Colors</h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.colors.map((color, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Stock</h2>
                  <p className="text-gray-600 mt-1">{product.stock} units available</p>
                </div>
              </div>

              <div className="mt-8">
                <button
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 
                           transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
