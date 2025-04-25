import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types
    const validImages = files.every(file => file.type.startsWith('image/'));
    if (!validImages) {
      setError('Please upload only image files');
      return;
    }

    // Validate file sizes (5MB limit per image)
    const validSizes = files.every(file => file.size <= 5 * 1024 * 1024);
    if (!validSizes) {
      setError('Each image must be less than 5MB');
      return;
    }

    setImages(files);
    const urls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return urls;
    });
    setVideo(null);
    setVideoPreviewUrl('');
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setVideo(null);
      setVideoPreviewUrl('');
      return;
    }

    // Validate video size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setError('Video must be less than 15MB');
      return;
    }

    // Validate video format
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      setError('Only MP4 and QuickTime videos are supported');
      return;
    }

    const videoURL = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';

    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);

      if (videoElement.duration > 30) {
        setError('Video must be 30 seconds or less');
        setVideo(null);
        setVideoPreviewUrl('');
        return;
      }

      setVideo(file);
      setVideoPreviewUrl(videoURL);
      setImages([]);
      setImagePreviewUrls([]);
      setError('');
    };

    videoElement.onerror = () => {
      setError('Could not load video. Please try a different file.');
      window.URL.revokeObjectURL(videoElement.src);
    };

    videoElement.src = videoURL;
  };

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setError('Please login to create a tutorial');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('userId', user.id);
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      
      // Filter out empty steps and materials
      const filteredSteps = formData.steps.filter(step => step.trim());
      const filteredMaterials = formData.materials.filter(material => material.trim());

      // Check if there are any steps
      if (filteredSteps.length === 0) {
        setError('At least one step is required');
        setLoading(false);
        return;
      }
      
      // Append each step and material individually with the correct parameter name
      filteredSteps.forEach((step) => {
        formDataToSend.append('steps', step);
      });
      
      filteredMaterials.forEach((material) => {
        formDataToSend.append('materials', material);
      });

      if (images && images.length > 0) {
        images.forEach(image => {
          formDataToSend.append('images', image);
        });
      }

      // Add video if selected
      if (video) {
        formDataToSend.append('video', video);
      }

      await axiosInstance.post('/api/tutorials', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Redirect to tutorials page after successful creation
      navigate('/tutorials');
      
    } catch (err) {
      console.error('Error creating tutorial:', err);
      setError(err.response?.data?.message || 'Failed to create tutorial');
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, '']
    });
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, '']
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="group mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Go Back</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8 backdrop-blur-sm backdrop-filter">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Create Tutorial</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg animate-fadeIn">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Enter tutorial title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Describe your tutorial"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">Steps</label>
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 mb-3 group">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const newSteps = [...formData.steps];
                        newSteps[index] = e.target.value;
                        setFormData({...formData, steps: newSteps});
                      }}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder={`Step ${index + 1}`}
                    />
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSteps = formData.steps.filter((_, i) => i !== index);
                          setFormData({...formData, steps: newSteps});
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStep}
                  className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Step
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">Materials</label>
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex gap-3 mb-3 group">
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => {
                        const newMaterials = [...formData.materials];
                        newMaterials[index] = e.target.value;
                        setFormData({...formData, materials: newMaterials});
                      }}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder={`Material ${index + 1}`}
                    />
                    {formData.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newMaterials = formData.materials.filter((_, i) => i !== index);
                          setFormData({...formData, materials: newMaterials});
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMaterial}
                  className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Material
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                      disabled={!!video}
                    />
                    {imagePreviewUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Video (Optional)
                      <span className="text-xs text-gray-500 ml-2">Max 15MB, 30 sec</span>
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      onChange={handleVideoChange}
                      className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                      disabled={images.length > 0}
                    />
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
                
                <p className="text-xs text-gray-500">
                  You can add either images or a video, but not both.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 transform hover:-translate-y-1 ${
                loading || !formData.title.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                'Create Tutorial'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TutorialForm;
