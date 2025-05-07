import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import axiosInstance from "../utils/axios";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [suggestedProfiles, setSuggestedProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState({});
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const defaultAvatarUrl = "/images/default-avatar.png";
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second delay between retries

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchSuggestedProfiles();
  }, []);

  const fetchPosts = async (attempt = 0) => {
    try {
      setError(null);
      if (!isRefreshing) setLoading(true);
      const response = await axiosInstance.get("/api/posts");
      setPosts(response.data);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching posts:", err);
      if (retryCount < 3 && err.message === "User not found") {
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchPosts(retryCount + 1);
      }

      if (err.code === "ERR_NETWORK") {
        setError(isOffline ? 
          "You're offline. Please check your internet connection." :
          "Server is unreachable. Please try again later."
        );
      } else if (err.response?.status === 403) {
        navigate("/login");
      } else {
        setError("Failed to load posts. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchSuggestedProfiles = async (attempt = 0) => {
    try {
      setProfilesLoading(true);
      const response = await axiosInstance.get('/api/users/suggestions');
      
      if (Array.isArray(response.data)) {
        setSuggestedProfiles(
          response.data
            .filter(profile => 
              profile.id !== user?.id && 
              !followedUsers.has(profile.id)
            )
            .slice(0, 5)
        );
      } else {
        setSuggestedProfiles([]);
      }
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching suggested profiles:', err);
      
      if (err.code === "ERR_NETWORK" && attempt < maxRetries) {
        console.log(`Retrying fetch profiles... Attempt ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchSuggestedProfiles(attempt + 1);
      }

      setSuggestedProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRetryCount(0); // Reset retry count on manual refresh
    fetchPosts(0);
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    triggerCelebration();
  };

  const triggerCelebration = () => {
    setIsCelebrating(true);
    setTimeout(() => setIsCelebrating(false), 2000);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map((post) => 
      post.id === updatedPost.id ? {
        ...post,
        ...updatedPost,
        userReaction: updatedPost.userReaction,
        reactionCounts: updatedPost.reactionCounts
      } : post
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleFollow = async (profileId) => {
    if (!user) return;

    try {
      setFollowingStates(prev => ({ ...prev, [profileId]: true }));
      await axiosInstance.post(`/api/users/${profileId}/follow`, { followerId: user.id });
      
      // Update followedUsers in state and localStorage
      const newFollowedUsers = new Set(followedUsers);
      newFollowedUsers.add(profileId);
      setFollowedUsers(newFollowedUsers);
      localStorage.setItem('followedUsers', JSON.stringify([...newFollowedUsers]));

      // Remove followed profile from suggestions
      setSuggestedProfiles(profiles => 
        profiles.filter(profile => profile.id !== profileId)
      );

      // Update user's friends list in localStorage if needed
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const followedProfile = suggestedProfiles.find(p => p.id === profileId);
      if (currentUser && followedProfile) {
        currentUser.friends = currentUser.friends || [];
        currentUser.friends.push({
          id: followedProfile.id,
          name: `${followedProfile.firstName} ${followedProfile.lastName}`,
          profilePicture: followedProfile.profilePicture
        });
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (err) {
      console.error('Error following user:', err);
      setFollowingStates(prev => ({ ...prev, [profileId]: false }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative inline-block mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2 animate-gradient bg-300%">
              Welcome to Dry Craft
            </h1>
            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-400/30 via-blue-400/30 to-purple-400/30 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-purple-400/50 via-blue-400/50 to-purple-400/50 animate-shimmer"></div>
            </div>
          </div>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl mx-auto leading-relaxed">
            Join our vibrant community to share, connect, and grow with like-minded creators.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="relative overflow-hidden px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg 
                       hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                       group"
            >
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2 transition-all group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
            <button
              onClick={() => navigate("/register")}
              className="relative overflow-hidden px-8 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg 
                       hover:bg-purple-50 transform hover:-translate-y-0.5 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                       group"
            >
              <span className="relative z-10 flex items-center">
                <svg className="w-5 h-5 mr-2 transition-all group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-100 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-purple-500 border-opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-full h-12 w-12 bg-gradient-to-r from-purple-400 to-blue-500 animate-pulse shadow-lg"></div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-6">
            <div className="text-purple-600 font-medium text-lg animate-pulse">
              <span className="inline-block animate-wave" style={{ animationDelay: '0.1s' }}>L</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.2s' }}>o</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.3s' }}>a</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.4s' }}>d</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.5s' }}>i</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.6s' }}>n</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.7s' }}>g</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.8s' }}>.</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '0.9s' }}>.</span>
              <span className="inline-block animate-wave" style={{ animationDelay: '1.0s' }}>.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="bg-red-100 p-4 rounded-full animate-bounce">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="absolute -inset-2 border-2 border-red-200 rounded-full animate-ping opacity-75"></div>
            </div>
            <p className="text-red-600 text-xl font-semibold text-center mb-6">
              {error}
            </p>
            <button
              onClick={handleRefresh}
              className="relative overflow-hidden px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50"
            >
              {isRefreshing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                <span>Retry</span>
              )}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Celebration Effect */}
      {isCelebrating && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full animate-celebration"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                transform: 'translate(-50%, -50%)'
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => navigate("/profile")}
              className="relative w-14 h-14 rounded-full overflow-hidden cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl"
              onMouseEnter={() => setIsHoveringAvatar(true)}
              onMouseLeave={() => setIsHoveringAvatar(false)}
            >
              <img
                src={user?.profilePicture ? (user.profilePicture.startsWith('/api/') ? user.profilePicture : `/api/media/${user.profilePicture}`) : defaultAvatarUrl}
                alt="Profile"
                className={`w-full h-full object-cover transition-transform duration-500 ${isHoveringAvatar ? 'scale-110' : 'scale-100'}`}
              />
              {isHoveringAvatar && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300">
                  <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                {user?.firstName || 'User'}
              </h2>
              <p className="text-sm text-gray-500">Welcome back! 👋</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate("/marketplace")}
              className="relative px-4 py-2 text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2
                       group overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                <svg
                  className="w-5 h-5 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Marketplace
              </span>
              <span className="absolute inset-0 bg-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-1"></span>
            </button>
            <button
              onClick={() => navigate("/tutorials")}
              className="relative px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2
                       group overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                <svg
                  className="w-5 h-5 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Tutorials
              </span>
              <span className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-1"></span>
            </button>
            <button
              onClick={handleLogout}
              className="relative px-4 py-2 text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2
                       group overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                <svg
                  className="w-5 h-5 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </span>
              <span className="absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-1"></span>
            </button>
          </div>
        </div>

        <CreatePost onPostCreated={handlePostCreated} />

        {/* Suggested Profiles */}
        <div className="bg-white rounded-xl shadow-md p-4 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              People you might know
            </h3>
            <button 
              onClick={fetchSuggestedProfiles}
              className="text-sm text-purple-600 hover:text-purple-800 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          {profilesLoading ? (
            <div className="flex space-x-4 overflow-x-auto py-2">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div key={index} className="flex-shrink-0 w-40 animate-pulse">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : suggestedProfiles.length > 0 ? (
            <div className="flex space-x-4 overflow-x-auto py-2 scrollbar-hide">
              {suggestedProfiles.map((profile) => (
                <div 
                  key={profile.id} 
                  className="flex-shrink-0 w-40 text-center transition-transform duration-300 hover:scale-105"
                >
                  <div 
                    className="group relative cursor-pointer"
                    onClick={(e) => {
                      if (e.target.tagName !== 'BUTTON') {
                        navigate(`/profile/${profile.id}`);
                      }
                    }}
                  >
                    <div className="w-20 h-20 mx-auto mb-3 relative">
                      <img
                        src={profile.profilePicture ? 
                          (profile.profilePicture.startsWith('/api/') ? 
                            profile.profilePicture : 
                            `/api/media/${profile.profilePicture}`
                          ) : 
                          defaultAvatarUrl
                        }
                        alt={`${profile.firstName}'s profile`}
                        className="w-full h-full rounded-full object-cover border-2 border-purple-100 group-hover:border-purple-500 transition-all duration-300 shadow-md group-hover:shadow-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultAvatarUrl;
                        }}
                      />
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 -z-10"></div>
                    </div>
                    <h4 className="font-medium text-gray-800 truncate group-hover:text-purple-600 transition-colors">
                      {profile.firstName} {profile.lastName}
                    </h4>
                    <p className="text-sm text-gray-500 truncate mb-2">{profile.bio}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(profile.id);
                      }}
                      disabled={followingStates[profile.id]}
                      className={`px-4 py-1 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden
                        ${followingStates[profile.id]
                          ? 'bg-purple-100 text-purple-500 cursor-default'
                          : 'bg-purple-500 text-white hover:bg-purple-600 hover:shadow-md transform hover:-translate-y-0.5'
                        }`}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {followingStates[profile.id] ? (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Following
                          </>
                        ) : 'Follow'}
                      </span>
                      {!followingStates[profile.id] && (
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="inline-block p-3 bg-gray-100 rounded-full mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <p className="text-gray-500">No suggestions available</p>
              <button 
                onClick={fetchSuggestedProfiles}
                className="mt-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Feed Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Community Feed
          </h2>
          <button 
            onClick={handleRefresh}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors group"
          >
            {isRefreshing ? (
              <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="-ml-1 mr-1 h-4 w-4 text-blue-600 group-hover:rotate-180 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="space-y-6">
          {posts.map((post, index) => (
            <div 
              key={post.id}
              className="transform transition-all duration-500 hover:scale-[1.01] group"
              style={{
                animation: `fadeInUp ${0.3 + (index * 0.05)}s ease-out forwards`,
                opacity: 0
              }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 blur transition-all duration-300"></div>
                <div className="relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 group-hover:shadow-lg">
                  <Post
                    post={post}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-32 w-32 text-gray-300 mb-6 animate-float">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="drop-shadow-sm"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent mb-3">
              No posts yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              The community is waiting for your first post! Share your thoughts, ideas, or questions.
            </p>
            <div className="mt-6">
              <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 p-0.5 rounded-full animate-gradient-xy bg-300%">
                <button 
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="px-6 py-2 bg-white rounded-full text-purple-600 font-medium hover:text-purple-800 transition-colors"
                >
                  Create First Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes gradient-xy {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes wave {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes celebration {
            0% { 
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% { 
              transform: translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px) scale(0);
              opacity: 0;
            }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .animate-wave {
            display: inline-block;
            animation: wave 1s ease-in-out infinite;
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-gradient-xy {
            background-size: 200% 200%;
            animation: gradient-xy 3s ease infinite;
          }
          .animate-celebration {
            animation: celebration 2s ease-out forwards;
          }
          .animate-shimmer {
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite linear;
          }
          .animate-gradient {
            animation: gradient-xy 3s ease infinite;
            background-size: 200% 200%;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
}

export default Home;