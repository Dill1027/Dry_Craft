import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

function UserVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchUserVideos();
  }, []);

  const fetchUserVideos = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/posts/user/${user.id}`);
      const allVideos = response.data.reduce((acc, post) => {
        if (post.videoUrl) {
          acc.push({
            url: post.videoUrl,
            postId: post.id,
            createdAt: post.createdAt
          });
        }
        return acc;
      }, []);
      setVideos(allVideos);
    } catch (err) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Videos</h1>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 text-gray-600 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>
        </div>

        {error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No videos yet</h3>
            <p className="mt-1 text-gray-500">Start sharing videos in your posts!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div 
                key={`${video.postId}-${index}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-video">
                  <video
                    src={video.url.startsWith('/api/') ? video.url : `/api/media/${video.url}`}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500">
                    Posted on {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserVideos;
