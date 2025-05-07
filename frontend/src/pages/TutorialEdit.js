import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

function TutorialEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [''],
    materials: [''],
    craftType: '' // Add craftType
  });

  // Add craft types constant
  const craftTypes = [
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
    const fetchTutorial = async () => {
      try {
        const response = await axiosInstance.get(`/api/tutorials/${id}`);
        const tutorial = response.data;
        setFormData({
          title: tutorial.title,
          description: tutorial.description,
          steps: tutorial.steps || [''],
          materials: tutorial.materials || [''],
          craftType: tutorial.craftType || '' // Add craftType
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/api/tutorials/${id}`, formData);
      navigate('/my-tutorials');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tutorial');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/my-tutorials')}
          className="group mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to My Tutorials</span>
        </button>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8">
            Edit Tutorial
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Craft Type</label>
              <select
                value={formData.craftType}
                onChange={(e) => setFormData({ ...formData, craftType: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a craft type</option>
                {craftTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
              {formData.steps.map((step, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => {
                      const newSteps = [...formData.steps];
                      newSteps[index] = e.target.value;
                      setFormData({ ...formData, steps: newSteps });
                    }}
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Step ${index + 1}`}
                  />
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newSteps = formData.steps.filter((_, i) => i !== index);
                        setFormData({ ...formData, steps: newSteps });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, steps: [...formData.steps, ''] })}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add Step
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
              {formData.materials.map((material, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => {
                      const newMaterials = [...formData.materials];
                      newMaterials[index] = e.target.value;
                      setFormData({ ...formData, materials: newMaterials });
                    }}
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Material ${index + 1}`}
                  />
                  {formData.materials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newMaterials = formData.materials.filter((_, i) => i !== index);
                        setFormData({ ...formData, materials: newMaterials });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, materials: [...formData.materials, ''] })}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Add Material
              </button>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/my-tutorials')}
                className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TutorialEdit;
