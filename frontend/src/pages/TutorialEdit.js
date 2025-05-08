import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

function TutorialEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [''],
    materials: [''],
    craftType: ''
  });
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [currentImages, setCurrentImages] = useState([]);
  const [currentVideo, setCurrentVideo] = useState('');

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
          craftType: tutorial.craftType || ''
        });
        setCurrentImages(tutorial.imageUrls || []);
        setCurrentVideo(tutorial.videoUrl || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));

    const validImages = files.every(file => file.type.startsWith('image/'));
    if (!validImages) {
      setError('Please upload only image files');
      return;
    }

    const validSizes = files.every(file => file.size <= 5 * 1024 * 1024);
    if (!validSizes) {
      setError('Each image must be less than 5MB');
      return;
    }

    setImages(files);
    const urls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    setError('');
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('Video must be less than 500MB');
      return;
    }

    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      setError('Only MP4 and QuickTime videos are supported');
      return;
    }

    const videoURL = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';

    videoElement.onloadedmetadata = () => {
      if (videoElement.duration > 30) {
        URL.revokeObjectURL(videoURL);
        setError('Video must be 30 seconds or less');
        return;
      }

      setVideo(file);
      setVideoPreviewUrl(videoURL);
      setError('');
    };

    videoElement.onerror = () => {
      URL.revokeObjectURL(videoURL);
      setError('Could not load video. Please try a different file.');
    };

    videoElement.src = videoURL;
  };

  const clearImages = () => {
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImages([]);
    setImagePreviewUrls([]);
  };

  const clearVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideo(null);
    setVideoPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      
      // Basic fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('craftType', formData.craftType);

      // Convert arrays to JSON strings
      const filteredSteps = formData.steps.filter(step => step.trim());
      formDataToSend.append('steps', JSON.stringify(filteredSteps));

      const filteredMaterials = formData.materials.filter(material => material.trim());
      formDataToSend.append('materials', JSON.stringify(filteredMaterials));

      // Media files with chunk handling for video
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          formDataToSend.append('images', images[i]);
        }
      }

      if (video) {
        formDataToSend.append('video', video);
      }

      // Flags
      formDataToSend.append('keepExistingImages', currentImages.length > 0);
      formDataToSend.append('keepExistingVideo', Boolean(currentVideo));

      const response = await axiosInstance.uploadMedia(`/api/tutorials/${id}`, formDataToSend, {
        method: 'PUT',
        timeout: 300000, // Increase to 5 minutes
        retries: 3,
        headers: {
          'Accept': 'application/json'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.status === 200) {
        navigate('/my-tutorials');
      }
    } catch (err) {
      console.error('Update error:', err);
      let errorMessage = 'Failed to update tutorial';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try again or use smaller files.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'Invalid form data';
      } else if (err.response?.status === 415) {
        errorMessage = 'Server cannot process the uploaded files';
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Images {currentImages.length > 0 && `(${currentImages.length} current)`}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
                             file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {imagePreviewUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={clearImages}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Clear New Images
                    </button>
                  )}
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video {currentVideo && '(Current video exists)'}
                    <span className="text-xs text-gray-500 ml-2">Max 500MB, 30 sec</span>
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime"
                    onChange={handleVideoChange}
                    className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
                             file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {videoPreviewUrl && (
                    <button
                      type="button"
                      onClick={clearVideo}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Clear New Video
                    </button>
                  )}
                  {videoPreviewUrl && (
                    <div className="mt-4">
                      <video 
                        src={videoPreviewUrl} 
                        className="w-full h-48 object-cover rounded-lg" 
                        controls
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {submitting && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center mt-1">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

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
                disabled={submitting}
                className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg 
                          hover:from-indigo-700 hover:to-purple-700 transition-all duration-200
                          ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TutorialEdit;
