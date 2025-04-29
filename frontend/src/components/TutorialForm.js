import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

function TutorialForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [''],
    materials: ['']
  });
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('steps[')) {
      const index = parseInt(name.match(/\[(\d+)\]/)[1]);
      const newSteps = [...formData.steps];
      newSteps[index] = value;
      setFormData(prev => ({ ...prev, steps: newSteps }));
    } else if (name.startsWith('materials[')) {
      const index = parseInt(name.match(/\[(\d+)\]/)[1]);
      const newMaterials = [...formData.materials];
      newMaterials[index] = value;
      setFormData(prev => ({ ...prev, materials: newMaterials }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, '']
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validImages = files.every(file => file.type.startsWith('image/'));
      if (!validImages) {
        setError("Please upload only image files");
        return;
      }
      setImages(files);
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return urls;
      });
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("Video size must be less than 15MB");
      return;
    }

    if (!["video/mp4", "video/quicktime"].includes(file.type)) {
      setError("Only MP4 and QuickTime videos are supported");
      return;
    }

    const videoURL = URL.createObjectURL(file);
    const videoElement = document.createElement("video");
    videoElement.preload = "metadata";

    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);

      if (videoElement.duration > 30) {
        setError("Video must be 30 seconds or less");
        return;
      }

      setVideo(file);
      setVideoPreviewUrl(videoURL);
      setImages([]);
      setPreviewUrls([]);
      setError("");
    };

    videoElement.onerror = () => {
      setError("Could not load video. Please try a different file.");
      window.URL.revokeObjectURL(videoElement.src);
    };

    videoElement.src = videoURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setError('Please login to create a tutorial');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('userId', user.id);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      
      const filteredSteps = formData.steps.filter(step => step.trim());
      const filteredMaterials = formData.materials.filter(material => material.trim());
      
      filteredSteps.forEach(step => formDataToSend.append('steps', step));
      filteredMaterials.forEach(material => formDataToSend.append('materials', material));

      if (video) {
        formDataToSend.append('video', video);
      }

      if (images.length > 0) {
        images.forEach(image => {
          formDataToSend.append('images', image);
        });
      }

      const response = await axiosInstance.post('/api/tutorials', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      navigate('/tutorials');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tutorial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Tutorial</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
          {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={step}
                onChange={(e) => handleChange({ target: { name: `steps[${index}]`, value: e.target.value } })}
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Step ${index + 1}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
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
                onChange={(e) => handleChange({ target: { name: `materials[${index}]`, value: e.target.value } })}
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Material ${index + 1}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addMaterial}
            className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Material
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={!!video || loading}
              />
              <div className="px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-center">
                <span className="text-gray-600">Upload Images</span>
              </div>
            </label>

            <label className="flex-1">
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleVideoChange}
                className="hidden"
                disabled={images.length > 0 || loading}
              />
              <div className="px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-center">
                <span className="text-gray-600">Upload Video</span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {previewUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
            {videoPreviewUrl && (
              <video
                src={videoPreviewUrl}
                className="w-full h-32 object-cover rounded-lg"
                controls
              />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating...' : 'Create Tutorial'}
        </button>

        {loading && progress > 0 && (
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </form>
    </div>
  );
}

export default TutorialForm;
