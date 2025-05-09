import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

function TutorialForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [''],
    materials: [''],
    craftType: '' // Add this new field
  });
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [uploadData, setUploadData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    video: 0,
    images: 0,
    total: 0
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Clear existing previews first
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

    // Clear existing preview first
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    // Update size limit to 500MB (500 * 1024 * 1024 bytes)
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

  useEffect(() => {
    return () => {
      // Cleanup blob URLs when component unmounts
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [imagePreviewUrls, videoPreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitTutorial();
  };

  const uploadInChunks = async (file, chunkSize = 1024 * 1024) => {
    const chunks = Math.ceil(file.size / chunkSize);
    const uploadedChunks = [];

    for (let i = 0; i < chunks; i++) {
      const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('index', i);
      formData.append('total', chunks);
      formData.append('filename', file.name);

      try {
        const response = await axiosInstance.post('/api/media/chunk', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        uploadedChunks.push(response.data);
      } catch (error) {
        console.error('Chunk upload failed:', error);
        throw new Error('File upload failed');
      }
    }

    return uploadedChunks;
  };

  const submitTutorial = async (isRetry = false) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setError('Please login to create a tutorial');
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
      } else {
        setRetrying(true); 
      }
      setError('');
      setProgress(0);

      const formDataToSend = new FormData();
      formDataToSend.append('userId', user.id);
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('craftType', formData.craftType);

      // Store form data for retry
      if (!isRetry) {
        setUploadData({
          formData: formData,
          images: images,
          video: video
        });
      }

      // Handle media files first
      const processedImages = [];
      if (images?.length > 0) {
        for (const image of images) {
          if (image.size > 1024 * 1024) {
            processedImages.push(await compressImage(image));
          } else {
            processedImages.push(image);
          }
        }
      }

      // Handle video upload first if present
      if (video) {
        try {
          await uploadInChunks(video, (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              video: progress,
              total: (progress + (prev.images || 0)) / 2
            }));
          });
        } catch (error) {
          setError('Video upload failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Handle images
      if (processedImages.length > 0) {
        const imagePromises = processedImages.map(async (img, index) => {
          await uploadInChunks(img, (progress) => {
            setUploadProgress(prev => {
              const imageProgress = prev.images || 0;
              const newImageProgress = (imageProgress + (progress / processedImages.length));
              return {
                ...prev,
                images: newImageProgress,
                total: (newImageProgress + (prev.video || 0)) / 2
              };
            });
          });
        });

        try {
          await Promise.all(imagePromises);
        } catch (error) {
          setError('Image upload failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Update the main progress bar based on total progress
      setProgress(uploadProgress.total);

      // Add other data
      const filteredSteps = formData.steps.filter(step => step.trim());
      const filteredMaterials = formData.materials.filter(material => material.trim());

      if (filteredSteps.length === 0) {
        setError('At least one step is required');
        setLoading(false);
        return;
      }

      filteredSteps.forEach(step => formDataToSend.append('steps', step));
      filteredMaterials.forEach(material => formDataToSend.append('materials', material));

      // Upload with retry logic
      await axiosInstance.uploadMedia('/api/tutorials', formDataToSend, {
        timeout: 600000,
        retries: 3,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(progress);
        }
      });

      navigate('/tutorials');

    } catch (err) {
      console.error('Error creating tutorial:', err);
      let errorMsg;
      
      if (err.code === 'ECONNRESET' || err.code === 'ERR_NETWORK') {
        errorMsg = 'Connection lost. Click retry to attempt upload again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Upload timed out. Please try again with a smaller file or check your connection.';
      } else {
        errorMsg = err.response?.data?.message || 'Failed to create tutorial';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  // Add image compression utility
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.8);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
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

  const renderError = () => (
    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-red-700">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
          </svg>
          {error}
        </div>
        {(error.includes('Connection lost') || error.includes('timed out')) && (
          <button
            type="button"
            onClick={() => submitTutorial(true)}
            disabled={retrying}
            className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 
                     rounded-lg transition-colors duration-200 disabled:opacity-50 flex items-center"
          >
            {retrying ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Retrying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Retry
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="mb-4">
      {video && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">Video: {uploadProgress.video.toFixed(1)}%</span>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.video}%` }}
            />
          </div>
        </div>
      )}
      {images.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">Images: {uploadProgress.images.toFixed(1)}%</span>
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.images}%` }}
            />
          </div>
        </div>
      )}
      <div>
        <span className="text-sm text-gray-600">Total Progress: {uploadProgress.total.toFixed(1)}%</span>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress.total}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <button
          onClick={() => navigate('/')}
          className="group mb-8 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 
                   transition-all duration-300 hover:gap-3"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Go Back</span>
        </button>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/50">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r 
                       from-indigo-600 to-purple-600 mb-8 text-center">
            Create Tutorial
          </h2>

          {error && renderError()}
          {loading && renderProgress()}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 
                               transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                    Title
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 
                         focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300
                         bg-white/50 backdrop-blur-sm"
                  placeholder="Enter tutorial title"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 
                               transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                    Description
                  </div>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 
                         focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300
                         bg-white/50 backdrop-blur-sm resize-none"
                  placeholder="Describe your tutorial"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 group-hover:text-indigo-600 
                               transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                    </svg>
                    Craft Type
                  </div>
                </label>
                <select
                  value={formData.craftType}
                  onChange={(e) => setFormData({...formData, craftType: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 
                         focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300
                         bg-white/50 backdrop-blur-sm"
                  required
                >
                  <option value="">Select a craft type</option>
                  {craftTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Steps
                </label>
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
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 
                             focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300
                             bg-white/50 backdrop-blur-sm"
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

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  Materials
                </label>
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
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 
                             focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300
                             bg-white/50 backdrop-blur-sm"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                    />
                    {imagePreviewUrls.length > 0 && (
                      <button
                        type="button"
                        onClick={clearImages}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Clear Images
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
                              onError={() => {
                                console.error(`Failed to load preview for image ${index}`);
                                const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
                                setImagePreviewUrls(newUrls);
                              }}
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
                      <span className="text-xs text-gray-500 ml-2">Max 500MB, 30 sec</span>
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      onChange={handleVideoChange}
                      className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                    />
                    {videoPreviewUrl && (
                      <button
                        type="button"
                        onClick={clearVideo}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Clear Video
                      </button>
                    )}
                    {videoPreviewUrl && (
                      <div className="mt-4">
                        <video 
                          src={videoPreviewUrl} 
                          className="w-full h-48 object-cover rounded-lg" 
                          controls
                          onError={(e) => {
                            console.error('Video preview error:', e);
                            clearVideo();
                            setError('Failed to load video preview');
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 
                       transform hover:-translate-y-1 disabled:translate-y-0 relative overflow-hidden
                       disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className={`absolute inset-0 transition-all duration-300 
                           bg-gradient-to-r from-indigo-600 to-purple-600 
                           group-hover:from-indigo-700 group-hover:to-purple-700
                           ${loading ? 'animate-shimmer' : ''}`}></div>
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Create Tutorial
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TutorialForm;
