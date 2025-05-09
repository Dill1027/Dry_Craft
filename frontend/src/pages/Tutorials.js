import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorialCard from '../components/TutorialCard';
import axiosInstance from '../utils/axios';

function Tutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCraftType, setSelectedCraftType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedTutorials, setPinnedTutorials] = useState([]);
  const navigate = useNavigate();

  const craftTypes = [
    'All',
    'Paper Craft',
    'Wood Craft',
    'Textile Craft',
    'Pottery',
    'Jewelry Making',
    'Metal Craft',
    'Glass Craft',
    'Leather Craft',
    'Mixed Media',
    'Other'
  ];

  useEffect(() => {
    fetchTutorials();
  }, []);

  useEffect(() => {
    // Get pinned tutorial IDs from localStorage
    const pinnedIds = JSON.parse(localStorage.getItem('pinnedTutorials') || '[]');
    // Filter tutorials to get pinned ones
    const pinned = tutorials.filter(tutorial => pinnedIds.includes(tutorial.id));
    setPinnedTutorials(pinned);
  }, [tutorials]);

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

  const filteredTutorials = tutorials.filter(tutorial => (
    (selectedCraftType === 'All' || 
    tutorial.craftType?.toLowerCase() === selectedCraftType.toLowerCase()) &&
    (tutorial.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  ));

  // Split tutorials into pinned and unpinned
  const unpinnedTutorials = filteredTutorials.filter(
    tutorial => !pinnedTutorials.find(pinned => pinned.id === tutorial.id)
  );

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header with glass effect */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-2 text-blue-600 hover:text-blue-800 
                       transition-all duration-300 hover:gap-3"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Home</span>
            </button>
          </div>

          <div className="flex items-center gap-4">

          <select
              value={selectedCraftType}
              onChange={(e) => setSelectedCraftType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 
                       focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
            >
              {craftTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>


            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tutorials..."
                className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200
                         pl-10"
              />
              <svg 
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <button
              onClick={() => navigate('/my-tutorials')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg 
                     hover:from-indigo-700 hover:to-blue-700 transform hover:-translate-y-0.5 
                     transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Manage Tutorials
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title with gradient background */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl blur-3xl opacity-30"></div>
          <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Explore Tutorials
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl">
              Discover creative DIY projects and get inspired by our community's tutorials
            </p>
          </div>
        </div>

        {/* Pinned Tutorials Section */}
        {pinnedTutorials.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
              <h2 className="text-xl font-semibold text-gray-800">Pinned Tutorials</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
              {pinnedTutorials
                .filter(tutorial => (
                  (selectedCraftType === 'All' || 
                  tutorial.craftType?.toLowerCase() === selectedCraftType.toLowerCase()) &&
                  (tutorial.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  tutorial.description?.toLowerCase().includes(searchQuery.toLowerCase()))
                ))
                .map((tutorial, index) => (
                  <div 
                    key={tutorial.id} 
                    className="transform hover:-translate-y-2 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <TutorialCard tutorial={tutorial} isPinned={true} />
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Regular Tutorials Section */}
        {unpinnedTutorials.length === 0 ? (
          <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 
                        transform transition-all duration-500 hover:scale-[1.02]">
            <div className="mb-6 animate-bounce">
              <svg className="w-16 h-16 mx-auto text-blue-500 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {selectedCraftType === 'All' ? 'No tutorials yet' : `No ${selectedCraftType} tutorials found`}
            </h3>
            <p className="text-gray-600">
              {selectedCraftType === 'All' ? 'Be the first to share your creative ideas!' : 'Try a different craft type or create one yourself!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {unpinnedTutorials.map((tutorial, index) => (
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
