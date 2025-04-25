import React from 'react';
import { useNavigate } from 'react-router-dom';

function TutorialCard({ tutorial }) {
  const navigate = useNavigate();
  const thumbnailUrl = tutorial.imageUrls?.[0] || tutorial.videoUrl;

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer transform hover:-translate-y-1 transition-transform"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{tutorial.title}</h3>
        <p className="text-sm text-gray-500 mt-2">{tutorial.authorName}</p>
      </div>
    </div>
  );
}

export default TutorialCard;
