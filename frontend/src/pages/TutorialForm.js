import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

function TutorialForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    materials: [''],
    steps: [{ instructions: '', image: null }]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepPreviews, setStepPreviews] = useState([]);
  const navigate = useNavigate();

  const handleStepChange = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], instructions: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleStepImageChange = (index, file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload only image files');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Update step image
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], image: file };
    setFormData({ ...formData, steps: newSteps });

    // Create preview URL
    const newPreviews = [...stepPreviews];
    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    newPreviews[index] = URL.createObjectURL(file);
    setStepPreviews(newPreviews);
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { instructions: '', image: null }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('materials', JSON.stringify(formData.materials));

      // Handle steps and their images
      const stepsWithoutImages = formData.steps.map(step => ({
        instructions: step.instructions
      }));
      formDataToSend.append('steps', JSON.stringify(stepsWithoutImages));

      // Append step images separately
      formData.steps.forEach((step, index) => {
        if (step.image) {
          formDataToSend.append(`stepImages`, step.image);
          formDataToSend.append('stepImageIndices', index);
        }
      });

      const response = await axiosInstance.post('/api/tutorials', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/tutorials/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tutorial');
    } finally {
      setLoading(false);
    }
  };

  // Clean up preview URLs on unmount
  React.useEffect(() => {
    return () => {
      stepPreviews.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [stepPreviews]);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6">
      {/* Existing title, description, and materials fields */}
      {/* ... */}

      <div className="space-y-6 mt-8">
        <h3 className="text-xl font-semibold">Steps</h3>
        {formData.steps.map((step, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col gap-4">
              <textarea
                value={step.instructions}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`Step ${index + 1} instructions`}
                className="w-full p-3 border rounded-lg"
                rows="3"
                required
              />
              
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleStepImageChange(index, e.target.files[0])}
                  className="hidden"
                  id={`step-image-${index}`}
                />
                <label
                  htmlFor={`step-image-${index}`}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                >
                  {step.image ? 'Change Image' : 'Add Image'}
                </label>
                {stepPreviews[index] && (
                  <div className="relative group">
                    <img
                      src={stepPreviews[index]}
                      alt={`Step ${index + 1} preview`}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(stepPreviews[index]);
                        const newPreviews = [...stepPreviews];
                        newPreviews[index] = null;
                        setStepPreviews(newPreviews);
                        const newSteps = [...formData.steps];
                        newSteps[index] = { ...newSteps[index], image: null };
                        setFormData({ ...formData, steps: newSteps });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addStep}
          className="w-full py-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          + Add Step
        </button>
      </div>

      {/* Submit button */}
      <div className="mt-8">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Tutorial'}
        </button>
      </div>
    </form>
  );
}

export default TutorialForm;
