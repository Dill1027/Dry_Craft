import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Toast from './Toast';
import PinIcon from './PinIcon';

function TutorialCard({ tutorial, isManageable = false, onDelete, isPinned = false }) {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  
  useEffect(() => {
    // Check if user has completed this tutorial
    const savedProgress = JSON.parse(localStorage.getItem(`tutorial_${tutorial.id}_progress`)) || [];
    const tutorialSteps = tutorial.steps?.length || 0;
    setIsCompleted(savedProgress.length === tutorialSteps && tutorialSteps > 0);
  }, [tutorial.id, tutorial.steps]);

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card click when clicking delete
    if (!window.confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      const response = await axiosInstance.delete(`/api/tutorials/${tutorial.id}`);
      if (response.status === 200) {
        onDelete?.(tutorial.id);
        setToastMessage('✨ Tutorial successfully deleted!');
        setShowToast(true);
      } else {
        throw new Error('Failed to delete tutorial');
      }
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      setToastMessage('❌ Could not delete tutorial. Please try again.');
      setShowToast(true);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click when clicking edit
    navigate(`/tutorials/edit/${tutorial.id}`);
  };

  const handleUnpin = (e) => {
    e.stopPropagation(); // Prevent card click
    const pinnedTutorials = JSON.parse(localStorage.getItem('pinnedTutorials') || '[]');
    const updatedPinnedTutorials = pinnedTutorials.filter(id => id !== tutorial.id);
    localStorage.setItem('pinnedTutorials', JSON.stringify(updatedPinnedTutorials));
    setToastMessage('Tutorial unpinned successfully!');
    setShowToast(true);
    window.location.reload(); // Refresh to update the UI
  };

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg 
                   duration-300 cursor-pointer transform hover:-translate-y-1 transition-transform relative group
                   ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
        onClick={() => navigate(`/tutorials/${tutorial.id}`)}
      >
        {isPinned && (
          <button
            onClick={handleUnpin}
            className="absolute top-2 right-2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full 
                     shadow-lg hover:bg-white transition-all duration-200 group"
            title="Unpin tutorial"
          >
            <PinIcon 
              className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600" 
              isPinned={true}
              animate={true}
            />
          </button>
        )}
        <div className="relative pb-[56.25%]">
          {tutorial.videoUrl ? (
            <video 
              className="absolute top-0 left-0 w-full h-full object-cover"
              src={tutorial.videoUrl}
              poster={tutorial.imageUrls?.[0]}
            />
          ) : tutorial.imageUrls?.[0] ? (
            <img 
              className="absolute top-0 left-0 w-full h-full object-cover"
              src={tutorial.imageUrls[0]}
              alt={tutorial.title}
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full bg-gray-200 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
            {tutorial.title}
          </h3>
          <p className="text-sm text-gray-500 mt-2">{tutorial.authorName}</p>
          
          <div className="mt-4 flex justify-between items-center">
            {isManageable ? (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Delete
                </button>
              </div>
            ) : (
              <div className="flex justify-end w-full">
                {isCompleted && (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>Completed</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <Toast 
          message={toastMessage}
          type={toastMessage.includes('Failed') ? 'error' : 'success'}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}

export default TutorialCard;
