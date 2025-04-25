import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Confetti from 'react-confetti';

function TutorialDetail() {
  const [tutorial, setTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        console.log('Fetching tutorial with id:', id);
        const response = await axiosInstance.get(`/api/tutorials/${id}`);
        console.log('Tutorial data:', response.data);
        setTutorial(response.data);
        
        // Load saved progress
        const savedProgress = JSON.parse(localStorage.getItem(`tutorial_${id}_progress`)) || [];
        setCompletedSteps(savedProgress);
        if (response.data.steps) {
          updateProgress(savedProgress, response.data.steps.length);
        }
      } catch (err) {
        console.error('Error fetching tutorial:', err);
        setError(err.response?.data?.message || 'Failed to fetch tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateProgress = (completed, total) => {
    const progressPercentage = total > 0 ? (completed.length / total) * 100 : 0;
    setProgress(progressPercentage);
    
    // Show celebration when reaching 100%
    if (progressPercentage === 100 && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const toggleStepCompletion = (stepIndex) => {
    const newCompletedSteps = completedSteps.includes(stepIndex)
      ? completedSteps.filter(step => step !== stepIndex)
      : [...completedSteps, stepIndex];
    
    setCompletedSteps(newCompletedSteps);
    updateProgress(newCompletedSteps, tutorial.steps?.length || 0);
    localStorage.setItem(`tutorial_${id}_progress`, JSON.stringify(newCompletedSteps));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-xl">Tutorial not found</div>
      </div>
    );
  }

  console.log('Rendering tutorial:', tutorial);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute -top-8 left-0 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Go Back
        </button>

        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Title Section with Progress */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 relative">
            <h1 className="text-3xl font-bold text-white mb-4">
              {tutorial.title}
            </h1>
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white bg-blue-500">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-white">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mt-2 text-xs flex rounded-full bg-blue-200">
                <div 
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Description Section */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {tutorial.description}
              </p>
            </div>

            {/* Materials Section */}
            {tutorial.materials && tutorial.materials.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Materials Needed</h2>
                <div className="bg-purple-50 rounded-xl p-6">
                  <ul className="list-disc list-inside space-y-2">
                    {tutorial.materials.map((material, index) => (
                      <li key={index} className="text-gray-700 flex items-center gap-2">
                        <span className="text-purple-500">•</span>
                        {material}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Steps Section */}
            {tutorial.steps && tutorial.steps.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Steps</h2>
                <div className="space-y-6">
                  {tutorial.steps.map((step, index) => (
                    <div 
                      key={index}
                      className={`bg-green-50 rounded-xl p-6 transform transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
                        completedSteps.includes(index) ? 'border-2 border-green-500' : ''
                      }`}
                      onClick={() => toggleStepCompletion(index)}
                    >
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              completedSteps.includes(index)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {completedSteps.includes(index) ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span>{index + 1}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <p className="text-gray-700">
                              {step.instructions || step}
                            </p>
                            {completedSteps.includes(index) && (
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Step Image */}
                        {step.imageUrl && (
                          <div className="mt-4 relative group overflow-hidden rounded-lg shadow-md">
                            <img
                              src={step.imageUrl.startsWith('/api/') ? step.imageUrl : `/api/media/${step.imageUrl}`}
                              alt={`Step ${index + 1} visualization`}
                              className="w-full object-cover rounded-lg transform transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Section moved to bottom with enhanced styling */}
            {(tutorial.videoUrl || tutorial.imageUrl) && (
              <div className="mt-8 transform transition-all duration-500 hover:scale-[1.02]">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Tutorial Media
                </h2>
                <div className="bg-gray-50 rounded-xl p-6 overflow-hidden shadow-inner">
                  <div className="relative group">
                    {tutorial.videoUrl ? (
                      <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-[1.01]">
                        <video 
                          src={tutorial.videoUrl}
                          controls
                          className="w-full h-full object-cover"
                          poster={tutorial.imageUrl}
                        />
                      </div>
                    ) : tutorial.imageUrl ? (
                      <div className="relative aspect-w-16 aspect-h-9 rounded-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-[1.01]">
                        <img
                          src={tutorial.imageUrl}
                          alt="Tutorial visualization"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {progress === 100 && (
              <div className="mt-8 text-center animate-bounce">
                <div className="inline-block bg-green-100 rounded-full p-4">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold text-green-600">Congratulations!</h3>
                <p className="text-green-500">You've completed this tutorial!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialDetail;
