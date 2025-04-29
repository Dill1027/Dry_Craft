import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

function CreateTutorial({ onTutorialCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [''],
    materials: [''] // Add materials array
  });
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [mediaPreview, setMediaPreview] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      // Check video size (max 30MB)
      if (file.size > 30 * 1024 * 1024) {
        setError('Video size must be less than 30MB');
        return;
      }

      // Check video type
      if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
        setError('Only MP4 and QuickTime videos are supported');
        return;
      }
      setMediaType('video');
    } else if (file.type.startsWith('image/')) {
      // Check image size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setMediaType('image');
    } else {
      setError('Invalid file type');
      return;
    }

    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, '']
    });
  };

  const handleRemoveStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  const handleAddMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, '']
    });
  };

  const handleRemoveMaterial = (index) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      materials: newMaterials
    });
  };

  const handleMaterialChange = (index, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index] = value;
    setFormData({
      ...formData,
      materials: newMaterials
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setIsLoading(true);
      setError('');
      
      const tutorial = new FormData();
      tutorial.append('title', formData.title);
      tutorial.append('description', formData.description);
      tutorial.append('authorId', user.id);
      
      formData.steps.forEach((step, index) => {
        if (step.trim()) {
          tutorial.append(`steps[${index}]`, step);
        }
      });

      formData.materials.forEach((material, index) => {
        if (material.trim()) {
          tutorial.append(`materials[${index}]`, material);
        }
      });

      if (media) {
        tutorial.append(mediaType === 'video' ? 'video' : 'image', media);
      }

      const response = await axiosInstance.uploadMedia('/api/tutorials', tutorial, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      // Reset form
      setFormData({ title: '', description: '', steps: [''], materials: [''] });
      setMedia(null);
      setMediaPreview('');
      setProgress(0);
      
      if (onTutorialCreated) {
        onTutorialCreated(response.data);
      }

    } catch (err) {
      console.error('Error creating tutorial:', err);
      setError(err.response?.data || 'Failed to create tutorial');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Create Tutorial</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Tutorial Title"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Description"
            rows="4"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>


        <div className="space-y-2">
          <h3 className="font-semibold">Required Materials</h3>
          {formData.materials.map((material, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={material}
                onChange={(e) => handleMaterialChange(index, e.target.value)}
                placeholder={`Material ${index + 1}`}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formData.materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddMaterial}
            className="text-blue-500 hover:text-blue-600"
          >
            + Add Material
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Steps</h3>
          {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formData.steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddStep}
            className="text-blue-500 hover:text-blue-600"
          >
            + Add Step
          </button>
        </div>

       

        <div className="space-y-2">
          <h3 className="font-semibold">Media</h3>
          <input
            type="file"
            accept="image/*,video/mp4,video/quicktime"
            onChange={handleMediaChange}
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            Supported formats: Images (up to 5MB), Videos (MP4/MOV up to 30MB)
          </p>
          
          {mediaPreview && (
            <div className="mt-2">
              {mediaType === 'video' ? (
                <video
                  src={mediaPreview}
                  className="max-h-96 w-full object-contain rounded-lg"
                  controls
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-h-96 w-full object-contain rounded-lg"
                />
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !formData.title.trim()}
          className={`w-full py-3 rounded-lg font-semibold text-white
            ${isLoading || !formData.title.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isLoading ? 'Creating...' : 'Create Tutorial'}
        </button>

        {isLoading && progress > 0 && (
          <div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-center mt-1">Uploading: {progress}%</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default CreateTutorial;
