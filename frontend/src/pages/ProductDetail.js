import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { getFullUrl } from '../utils/apiUtils';
import { sendMessage } from '../services/messageService';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!message.trim()) return;

    try {
      setSending(true);
      await sendMessage(product.sellerId, user.id, product.id, message.trim());
      setMessage('');
      setShowMessageModal(false);
      // Navigate to messages page after successful send
      navigate('/messages');
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

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
                  onClick={() => setShowMessageModal(true)}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 
                           transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Contact Seller
                </button>

                {/* Message Modal */}
                {showMessageModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-semibold mb-4">Message to Seller</h3>
                      {error && (
                        <p className="text-red-500 mb-4">{error}</p>
                      )}
                      {success && (
                        <p className="text-green-500 mb-4">{success}</p>
                      )}
                      <form onSubmit={handleSendMessage}>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type your message here..."
                          rows="4"
                          className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMessageModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={sending || !message.trim()}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                                     transition-colors disabled:bg-purple-300"
                          >
                            {sending ? 'Sending...' : 'Send Message'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
