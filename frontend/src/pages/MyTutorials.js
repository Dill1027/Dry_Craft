import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorialCard from '../components/TutorialCard';
import axiosInstance from '../utils/axios';

function MyTutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyTutorials();
  }, [navigate, user]);

  const fetchMyTutorials = async () => {
    try {
      const response = await axiosInstance.get(`/api/tutorials?userId=${user.id}`);
      setTutorials(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="group mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
        >
          <svg 
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Go Back</span>
        </button>

        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">My Tutorials</h1>
            <p className="mt-2 text-lg text-gray-600">Manage and organize your created tutorials</p>
          </div>
          <button
            onClick={() => navigate('/tutorials/create')}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg 
                     hover:from-green-600 hover:to-emerald-700 transform hover:-translate-y-0.5 
                     transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Tutorial
          </button>
        </div>

        {tutorials.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No tutorials yet</h3>
            <p className="text-gray-600 mb-6">Start sharing your knowledge by creating your first tutorial!</p>
            <button
              onClick={() => navigate('/tutorials/create')}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 
                       transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Tutorial
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutorials.map(tutorial => (
              <div key={tutorial.id} className="transform hover:-translate-y-1 transition-all duration-200">
                <TutorialCard
                  tutorial={tutorial}
                  isManageable={true}
                  onDelete={(deletedId) => {
                    setTutorials(tutorials.filter(t => t.id !== deletedId));
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTutorials;
