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
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    steps: [],
    materials: []
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyTutorials();
  }, [navigate, user]);

  const fetchMyTutorials = async () => {
    try {
      if (!user) {
        navigate('/login');
        return;
      }
      const response = await axiosInstance.get('/api/tutorials');
      // Filter tutorials to show only user's tutorials
      const userTutorials = response.data.filter(tutorial => tutorial.userId === user.id);
      setTutorials(userTutorials);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tutorial) => {
    setEditingTutorial(tutorial);
    setEditFormData({
      title: tutorial.title,
      description: tutorial.description,
      steps: [...tutorial.steps],
      materials: tutorial.materials ? [...tutorial.materials] : []
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);

    try {
      const response = await axiosInstance.put(`/api/tutorials/${editingTutorial.id}`, editFormData);
      const updatedTutorials = tutorials.map(t => 
        t.id === editingTutorial.id ? response.data : t
      );
      setTutorials(updatedTutorials);
      setEditingTutorial(null);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update tutorial');
    } finally {
      setUpdating(false);
    }
  };

  const addStep = () => {
    setEditFormData({
      ...editFormData,
      steps: [...editFormData.steps, '']
    });
  };

  const removeStep = (index) => {
    const newSteps = editFormData.steps.filter((_, i) => i !== index);
    setEditFormData({
      ...editFormData,
      steps: newSteps
    });
  };

  const addMaterial = () => {
    setEditFormData({
      ...editFormData,
      materials: [...editFormData.materials, '']
    });
  };

  const removeMaterial = (index) => {
    const newMaterials = editFormData.materials.filter((_, i) => i !== index);
    setEditFormData({
      ...editFormData,
      materials: newMaterials
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="relative">
          <div className="w-20 h-20 border-t-4 border-b-4 border-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-600">Loading</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header with glass effect */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/tutorials')}
            className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-800 
                     transition-all duration-300 hover:gap-3"
          >
            <svg 
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Tutorials</span>
          </button>
          
          <button
            onClick={() => navigate('/tutorials/create')}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg 
                     hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 
                     transition-all duration-200 shadow-md hover:shadow-xl font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Tutorial
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-2xl blur-3xl opacity-30"></div>
          <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-700">
              My Tutorials
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl">
              Share your knowledge and creativity with the world. Manage your tutorials here.
            </p>
          </div>
        </div>

        {/* Tutorial Content */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p className="font-medium">{error}</p>
            <p className="mt-1">Please try refreshing the page or check your connection.</p>
          </div>
        )}

        {tutorials.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 
                         transform hover:scale-[1.01] transition-all duration-500">
            <div className="mb-8 relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
              <div className="relative flex items-center justify-center w-full h-full">
                <svg className="w-20 h-20 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-3">No tutorials yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Share your unique perspective and knowledge by creating your first tutorial!
            </p>
            <button
              onClick={() => navigate('/tutorials/create')}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl 
                       hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 
                       transition-all duration-300 shadow-lg hover:shadow-2xl inline-flex items-center gap-3 font-medium"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Tutorial
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map(tutorial => (
              <div key={tutorial.id} className="transform transition-all duration-300 hover:scale-[1.02]">
                <TutorialCard
                  tutorial={tutorial}
                  isManageable={true}
                  onEdit={() => handleEdit(tutorial)}
                  onDelete={(deletedId) => {
                    setTutorials(tutorials.filter(t => t.id !== deletedId));
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal with Glass Morphism */}
        {editingTutorial && (
          <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div 
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              style={{
                animation: 'fadeInUp 0.3s ease-out forwards'
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Edit Tutorial
                </h2>
                <button 
                  onClick={() => setEditingTutorial(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {updateError && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                  <p className="font-medium">{updateError}</p>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Tutorial title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Describe your tutorial"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Steps</label>
                    <button
                      type="button"
                      onClick={addStep}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Step
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-2">
                    {editFormData.steps.map((step, index) => (
                      <div key={index} className="flex gap-2 group">
                        <div className="flex-shrink-0 pt-2 text-indigo-600 font-medium">{index + 1}.</div>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => {
                            const newSteps = [...editFormData.steps];
                            newSteps[index] = e.target.value;
                            setEditFormData({...editFormData, steps: newSteps});
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`Describe step ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="px-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Materials</label>
                    <button
                      type="button"
                      onClick={addMaterial}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Material
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-2">
                    {editFormData.materials.map((material, index) => (
                      <div key={index} className="flex gap-2 group">
                        <div className="flex-shrink-0 pt-2 text-purple-600">•</div>
                        <input
                          type="text"
                          value={material}
                          onChange={(e) => {
                            const newMaterials = [...editFormData.materials];
                            newMaterials[index] = e.target.value;
                            setEditFormData({...editFormData, materials: newMaterials});
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`Material ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="px-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingTutorial(null)}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className={`px-5 py-2.5 rounded-lg text-white font-medium ${
                      updating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {updating ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MyTutorials;