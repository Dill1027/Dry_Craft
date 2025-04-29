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
      const response = await axiosInstance.get(`/api/tutorials?userId=${user.id}`);
      setTutorials(response.data);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="group mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 
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
          <span className="font-medium">Go Back</span>
        </button>

        <div className="flex justify-between items-center mb-12">
          <div className="transform transition-all duration-500 hover:scale-[1.02]">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              My Tutorials
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage and share your creative tutorials
            </p>
          </div>
          
          <button
            onClick={() => navigate('/tutorials/create')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg 
                     hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 
                     transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Tutorial
          </button>
        </div>

        {tutorials.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 
                        transform hover:scale-[1.01] transition-all duration-500">
            <div className="mb-6 animate-bounce">
              <svg className="w-16 h-16 mx-auto text-indigo-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">No tutorials yet</h3>
            <p className="text-gray-600 mb-6">Start sharing your knowledge by creating your first tutorial!</p>
            <button
              onClick={() => navigate('/tutorials/create')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg 
                       hover:from-indigo-600 hover:to-purple-700 transform hover:-translate-y-0.5 
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
            {tutorials.map((tutorial, index) => (
              <div 
                key={tutorial.id} 
                className="transform hover:-translate-y-2 transition-all duration-300"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
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

        {editingTutorial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6">
                Edit Tutorial
              </h2>
              
              {updateError && (
                <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg">{updateError}</div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows="4"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
                  {editFormData.steps.map((step, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...editFormData.steps];
                          newSteps[index] = e.target.value;
                          setEditFormData({...editFormData, steps: newSteps});
                        }}
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder={`Step ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    + Add Step
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
                  {editFormData.materials.map((material, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => {
                          const newMaterials = [...editFormData.materials];
                          newMaterials[index] = e.target.value;
                          setEditFormData({...editFormData, materials: newMaterials});
                        }}
                        className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder={`Material ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeMaterial(index)}
                        className="px-3 py-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    + Add Material
                  </button>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingTutorial(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className={`px-4 py-2 rounded text-white ${
                      updating ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {updating ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTutorials;
