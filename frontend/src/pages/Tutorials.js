import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorialCard from '../components/TutorialCard';
import axiosInstance from '../utils/axios';

function Tutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const response = await axiosInstance.get('/api/tutorials');
      setTutorials(response.data);
    } catch (err) {
      console.error('Error fetching tutorials:', err);
      setError(err.response?.data?.message || 'Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent shadow-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4">
        <div className="text-red-500 text-xl mb-4 animate-pulse">{error}</div>
        <button 
          onClick={() => fetchTutorials()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg
                   hover:from-blue-600 hover:to-indigo-700 transform hover:-translate-y-0.5 
                   transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-12">
          <div className="transform transition-all duration-500 hover:scale-[1.02]">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
              Explore Tutorials
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Discover creative DIY projects and get inspired
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="group px-4 py-2 flex items-center gap-2 text-blue-600 hover:text-blue-800 
                       transition-colors duration-200 rounded-lg hover:bg-white/50 backdrop-blur-sm"
            >
              <svg 
                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>

            <button
              onClick={() => navigate('/my-tutorials')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg 
                       hover:from-indigo-700 hover:to-blue-700 transform hover:-translate-y-0.5 
                       transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2
                       backdrop-blur-sm"
            >
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Manage Tutorials
            </button>
          </div>
        </div>

        {tutorials.length === 0 ? (
          <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 
                        transform transition-all duration-500 hover:scale-[1.02]">
            <div className="mb-6 animate-bounce">
              <svg className="w-16 h-16 mx-auto text-blue-500 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No tutorials yet</h3>
            <p className="text-gray-600">Be the first to share your creative ideas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {tutorials.map((tutorial, index) => (
              <div 
                key={tutorial.id} 
                className="transform hover:-translate-y-2 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TutorialCard tutorial={tutorial} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tutorials;
