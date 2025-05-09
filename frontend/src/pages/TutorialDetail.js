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
  const [isPinned, setIsPinned] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const response = await axiosInstance.get(`/api/tutorials/${id}`);
        setTutorial(response.data);

        // Check if tutorial is pinned
        const pinnedTutorials = JSON.parse(localStorage.getItem('pinnedTutorials') || '[]');
        setIsPinned(pinnedTutorials.includes(id));

        const savedProgress = JSON.parse(localStorage.getItem(`tutorial_${id}_progress`)) || [];
        setCompletedSteps(savedProgress);
        updateProgress(savedProgress, response.data.steps?.length || 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [id]);

  const updateProgress = (completed, total) => {
    const progressPercentage = total > 0 ? (completed.length / total) * 100 : 0;
    setProgress(progressPercentage);

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

  const handlePinToggle = () => {
    const pinnedTutorials = JSON.parse(localStorage.getItem('pinnedTutorials') || '[]');
    let newPinnedTutorials;

    if (isPinned) {
      newPinnedTutorials = pinnedTutorials.filter(pinnedId => pinnedId !== id);
    } else {
      newPinnedTutorials = [...pinnedTutorials, id];
    }

    localStorage.setItem('pinnedTutorials', JSON.stringify(newPinnedTutorials));
    setIsPinned(!isPinned);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/tutorials')}
            className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-800 
                     transition-all duration-300 hover:gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-lg"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span className="font-medium">Back to Tutorials</span>
          </button>

          <button
            onClick={handlePinToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300
                     ${isPinned 
                       ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                       : 'bg-white/50 text-gray-600 hover:bg-gray-100'}`}
          >
            <svg 
              className={`w-5 h-5 transform transition-transform duration-300 ${isPinned ? 'rotate-45' : ''}`} 
              fill={isPinned ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {isPinned ? 'Pinned' : 'Pin Tutorial'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow lg:w-2/3">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/50">
              <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-8 py-6">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{tutorial.title}</h1>
              </div>

              <div className="p-8">
                <div className="bg-blue-50 rounded-xl p-6 mb-8">
                  <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{tutorial.description}</p>
                </div>

                {tutorial.materials && tutorial.materials.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                      </svg>
                      Materials Needed
                    </h2>
                    <div className="bg-purple-50 rounded-xl p-6">
                      <ul className="space-y-3">
                        {tutorial.materials.map((material, index) => (
                          <li key={index} className="flex items-center gap-3 text-gray-700">
                            <span className="w-2 h-2 rounded-full bg-purple-500"/>
                            {material}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {tutorial.steps?.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                      Steps to Follow
                    </h2>
                    <div className="space-y-4">
                      {tutorial.steps.map((step, index) => (
                        <div
                          key={index}
                          onClick={() => toggleStepCompletion(index)}
                          className={`p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300
                                   border ${completedSteps.includes(index) ? 'border-green-500 bg-green-50' : 'border-gray-100'} 
                                   hover:border-indigo-100 cursor-pointer group`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 
                                             ${completedSteps.includes(index) 
                                               ? 'border-green-500 bg-green-500' 
                                               : 'border-gray-300 group-hover:border-indigo-400'}`}>
                                {completedSteps.includes(index) && (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className={`text-lg ${completedSteps.includes(index) ? 'text-green-700' : 'text-gray-700'}`}>
                                Step {index + 1}
                              </div>
                              <p className={`mt-1 ${completedSteps.includes(index) ? 'text-green-600' : 'text-gray-600'}`}>
                                {step}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(tutorial.videoUrl || tutorial.imageUrl) && (
                  <div className="mt-8 border-t pt-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Tutorial Media</h2>
                    <div className="max-w-2xl mx-auto">
                      <div className="relative rounded-xl overflow-hidden shadow-lg">
                        {tutorial.videoUrl ? (
                          <video 
                            src={tutorial.videoUrl}
                            controls
                            className="w-full h-auto max-h-[400px] object-contain bg-black"
                            poster={tutorial.imageUrl}
                            preload="metadata"
                          />
                        ) : tutorial.imageUrl && (
                          <img
                            src={tutorial.imageUrl}
                            alt="Tutorial visualization"
                            className="w-full h-auto max-h-[400px] object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 sticky top-8 border border-white/50">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r 
                             from-indigo-600 to-purple-600 mb-4">Progress Overview</h2>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full 
                                     bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        Step {completedSteps.length} of {tutorial.steps?.length}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-indigo-600">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                    <div 
                      style={{ width: `${progress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center 
                               bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 transition-all duration-500"
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
                <div className="grid grid-cols-4 gap-2 relative">
                  {tutorial.steps?.map((_, index) => (
                    <div key={index} className="relative">
                      <div
                        onClick={() => toggleStepCompletion(index)}
                        className={`aspect-square rounded-full flex items-center justify-center cursor-pointer 
                                 transition-all duration-300 text-lg font-semibold relative z-10
                                 ${completedSteps.includes(index)
                                   ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg scale-95'
                                   : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-indigo-400'
                                 }`}
                      >
                        {index + 1}
                      </div>
                      {index < tutorial.steps.length - 1 && completedSteps.includes(index) && (
                        <div className="absolute top-1/2 left-[calc(100%-1rem)] right-0 h-0.5 bg-gradient-to-r from-green-400 to-green-500 -translate-y-1/2 z-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {progress === 100 && (
                <div className="mt-8 text-center animate-bounce">
                  <div className="inline-block bg-green-100 rounded-full p-4">
                    <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-green-600">Congratulations!</h3>
                  <p className="text-green-500">You've completed this tutorial!</p>
                </div>
              )}
              
              {/* Add Image Gallery Section */}
              {tutorial.imageUrls && tutorial.imageUrls.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r 
                               from-indigo-600 to-purple-600 mb-4">Tutorial Images</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tutorial.imageUrls.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-video group">
                        <img
                          src={imageUrl}
                          alt={`Tutorial step ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg shadow-md transition-transform 
                                   duration-300 group-hover:scale-[1.02]"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/placeholder.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent 
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                                      rounded-lg flex items-end p-4">
                          <span className="text-white text-sm">Image {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} />}
    </div>
  );
}

export default TutorialDetail;
