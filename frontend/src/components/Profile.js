import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Post from './Post';

function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [bioError, setBioError] = useState('');
  const [friends, setFriends] = useState(user?.friends || []);

  const defaultAvatarUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/images/default-avatar.png`;

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;

    // Check if user exists and has ID
    if (!user || !user.id) {
      setError('User session expired. Please login again');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('image', image);

      const response = await axiosInstance.put(`/api/users/${user.id}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Only update if the request was successful
      if (response.data && response.data.profilePicture) {
        const updatedUser = { ...user, profilePicture: response.data.profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Profile picture updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err) {
      console.error('Error updating profile picture:', err);
      setError(err.response?.data?.message || 'Failed to update profile picture');
      if (err.response?.status === 401) {
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBioUpdate = async () => {
    try {
      const response = await axiosInstance.put(`/api/users/${user.id}/bio`, {
        bio: bio.trim()
      });

      if (response.data && response.data.bio !== undefined) {
        const updatedUser = { ...user, bio: response.data.bio };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditingBio(false);
        setSuccess('Bio updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setBioError(err.response?.data?.message || 'Failed to update bio');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get(`/api/notifications/unread?userId=${user?.id}`);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await axiosInstance.post(`/api/users/${friendId}/unfollow`, { followerId: user.id });
      
      // Update local state
      setFriends(friends.filter(friend => friend.id !== friendId));
      
      // Update user's friends list in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser && currentUser.friends) {
        currentUser.friends = currentUser.friends.filter(f => f.id !== friendId);
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      // Update followedUsers in localStorage
      const followedUsers = JSON.parse(localStorage.getItem('followedUsers') || '[]');
      const updatedFollowedUsers = followedUsers.filter(id => id !== friendId);
      localStorage.setItem('followedUsers', JSON.stringify(updatedFollowedUsers));

      setSuccess('Friend removed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove friend');
      setTimeout(() => setError(''), 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    fetchUserPosts();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    // Update friends when user data changes
    const updatedUser = JSON.parse(localStorage.getItem('user'));
    if (updatedUser?.friends) {
      setFriends(updatedUser.friends);
    }
  }, []);

  const fetchUserPosts = async () => {
    if (!user?.id) return;

    try {
      setPostsLoading(true);
      const response = await axiosInstance.get(`/api/posts/user/${user.id}`);
      setPosts(response.data);
    } catch (err) {
      setPostsError(err.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(post =>
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
          {/* Header with gradient background and back button */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold">Profile Settings</h2>
              <div className="flex items-center space-x-4">
                {/* Add notification button */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors relative"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notifications?.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notification dropdown */}
                  {showNotifications && notifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h3>
                        {notifications.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">No new notifications</p>
                        ) : (
                          <div className="space-y-4">
                            {notifications.map(notification => (
                              <div key={notification.id} className="flex items-start p-3 bg-blue-50 rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800">
                                    <span className="font-semibold">{notification.senderName}</span>
                                    {' commented on your post: '}
                                    <span className="text-gray-600">"{notification.content}"</span>
                                  </p>
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="text-sm text-blue-500 hover:text-blue-600"
                                    >
                                      Mark as read
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Existing back button */}
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center space-x-2 transition-all duration-300 hover:transform hover:-translate-x-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Feed</span>
                </button>
              </div>
            </div>
            <p className="text-blue-100">Manage your account information</p>
          </div>

          {/* Main content */}
          <div className="p-6 md:p-8">
            {/* Status messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center animate-shake">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg border border-green-200 flex items-center animate-fadeIn">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {success}
              </div>
            )}

            {/* Profile section */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
              {/* Avatar with hover effect */}
              <div 
                className="relative group cursor-pointer"
                onClick={triggerFileInput}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative">
                  <img
                    src={previewUrl || (user.profilePicture ? (user.profilePicture.startsWith('/api/') ? user.profilePicture : `/api/media/${user.profilePicture}`) : defaultAvatarUrl)}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAvatarUrl;
                    }}
                  />
                  {isHovered && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-all duration-300">
                      <div className="text-white text-center">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs">Change Photo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
              />

              {/* User info */}
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{user.firstName} {user.lastName}</h3>
                <p className="text-gray-600 mb-3">{user.email}</p>
                <div className="flex space-x-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Member</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Verified</span>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => navigate('/profile/photos')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    My Photos
                  </button>
                  
                  <button
                    onClick={() => navigate('/profile/videos')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    My Videos
                  </button>

                  <button
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    My Products
                  </button>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="w-full max-w-2xl mx-auto mt-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Bio</h3>
                  {!editingBio && (
                    <button
                      onClick={() => setEditingBio(true)}
                      className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {editingBio ? (
                  <div className="space-y-4">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write something about yourself..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows="4"
                      maxLength="500"
                    />
                    {bioError && (
                      <p className="text-red-500 text-sm">{bioError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingBio(false);
                          setBio(user?.bio || '');
                          setBioError('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBioUpdate}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {user?.bio || 'No bio yet. Click edit to add one!'}
                  </p>
                )}
              </div>
            </div>

            {/* Friends Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Friends</h2>
              {friends.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No friends added yet</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <div 
                      key={friend.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative group"
                    >
                      <div 
                        onClick={() => navigate(`/profile/${friend.id}`)}
                        className="flex items-center flex-1 cursor-pointer min-w-0"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                          <img
                            src={friend.profilePicture ? 
                              (friend.profilePicture.startsWith('/api/') ? 
                                friend.profilePicture : 
                                `/api/media/${friend.profilePicture}`
                              ) : 
                              defaultAvatarUrl
                            }
                            alt={friend.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = defaultAvatarUrl;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{friend.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to remove this friend?')) {
                            handleRemoveFriend(friend.id);
                          }
                        }}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 rounded-full"
                        title="Remove friend"
                      >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Posts Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Posts</h2>
              
              {postsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : postsError ? (
                <div className="text-center py-8 text-red-600">{postsError}</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p>You haven't posted anything yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div 
                      key={post.id}
                      className="transform transition-all duration-300 hover:scale-[1.01]"
                    >
                      <Post
                        post={post}
                        onPostDeleted={handlePostDeleted}
                        onPostUpdated={handlePostUpdated}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
      `}</style>
    </div>
  );
}

export default Profile;