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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tutorials</h1>
          <button
            onClick={() => navigate('/tutorials/create')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Create Tutorial
          </button>
        </div>

        {tutorials.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-600">You haven't created any tutorials yet</h3>
            <p className="text-gray-500 mt-2">Start creating your first tutorial!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map(tutorial => (
              <TutorialCard 
                key={tutorial.id} 
                tutorial={tutorial} 
                isManageable={true}
                onDelete={(deletedId) => {
                  setTutorials(tutorials.filter(t => t.id !== deletedId));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTutorials;
