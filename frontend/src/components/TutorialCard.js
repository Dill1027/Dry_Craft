import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Toast from './Toast';

function TutorialCard({ tutorial, isManageable = false, onDelete }) {
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

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg 
                   duration-300 cursor-pointer transform hover:-translate-y-1 transition-transform relative group
                   ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
        onClick={() => navigate(`/tutorials/${tutorial.id}`)}
      >
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
