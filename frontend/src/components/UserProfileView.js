import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Post from './Post';

function UserProfileView() {
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followers, setFollowers] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();
  const { userId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const defaultAvatarUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/images/default-avatar.png`;

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
    checkFollowStatus();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}`);
      setProfileUser(response.data);
    } catch (err) {
      setError('Failed to load user profile');
      if (err.response?.status === 404) {
        navigate('/404');
      }
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await axiosInstance.get(`/api/posts/user/${userId}`);
      setPosts(response.data);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}/followers`);
      setFollowers(response.data);
      setIsFollowing(response.data.some(follower => follower.id === currentUser?.id));
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollow = async () => {
    try {
      await axiosInstance.post(`/api/users/${userId}/follow`, { followerId: currentUser.id });
      setIsFollowing(true);
      setFollowers([...followers, currentUser]);
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const handleUnfollow = async () => {
    try {
      await axiosInstance.post(`/api/users/${userId}/unfollow`, { followerId: currentUser.id });
      setIsFollowing(false);
      setFollowers(followers.filter(f => f.id !== currentUser.id));
    } catch (err) {
      console.error('Error unfollowing user:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-white/90 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div className="mt-4">
              <h1 className="text-3xl font-bold">{profileUser?.firstName} {profileUser?.lastName}</h1>
              <p className="text-blue-100">{profileUser?.email}</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={profileUser?.profilePicture ? 
                    (profileUser.profilePicture.startsWith('/api/') ? 
                      profileUser.profilePicture : 
                      `/api/media/${profileUser.profilePicture}`
                    ) : 
                    defaultAvatarUrl
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultAvatarUrl;
                  }}
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profileUser?.firstName} {profileUser?.lastName}
                    </h2>
                    <p className="text-gray-600">{followers.length} Followers</p>
                  </div>
                  {currentUser && currentUser.id !== userId && (
                    <button
                      onClick={isFollowing ? handleUnfollow : handleFollow}
                      className={`px-6 py-2 rounded-full font-medium ${
                        isFollowing
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      } transition-colors`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>

                {profileUser?.bio && (
                  <p className="mt-4 text-gray-600 whitespace-pre-wrap">
                    {profileUser.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Posts</h3>
              <div className="space-y-6">
                {posts.map((post) => (
                  <Post key={post.id} post={post} />
                ))}
              </div>
              {posts.length === 0 && (
                <p className="text-center text-gray-500 py-8">No posts yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileView;
