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
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const defaultAvatarUrl = "/images/default-avatar.png";

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (retryCount = 0) => {
    try {
      setError(null);
      setLoading(true);
      const response = await axiosInstance.get("/api/posts");
      setPosts(response.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      if (retryCount < 3 && err.message === "User not found") {
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchPosts(retryCount + 1);
      }

      if (err.code === "ERR_NETWORK") {
        setError("Unable to connect to server. Please check your internet connection.");
      } else if (err.response?.status === 403) {
        navigate("/login");
      } else {
        setError("Something went wrong while loading posts. Please try again later.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPosts();
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    const celebration = document.createElement('div');
    celebration.className = 'celebration-effect';
    document.body.appendChild(celebration);
    setTimeout(() => celebration.remove(), 1000);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(
      posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-8">
            Welcome to Dry Craft
          </h1>
          <p className="text-gray-600 mb-8">
            Join our community to share and interact with others.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg 
                       hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg 
                       hover:bg-purple-50 transform hover:-translate-y-0.5 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Create Account
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
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 border-opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-full h-10 w-10 bg-gradient-to-r from-purple-400 to-blue-500 animate-pulse"></div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-purple-600 font-medium">
            Loading your feed...
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
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => navigate("/profile")}
              className="w-12 h-12 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all duration-200 shadow-md"
            >
              <img
                src={user?.profilePicture ? (user.profilePicture.startsWith('/api/') ? user.profilePicture : `/api/media/${user.profilePicture}`) : defaultAvatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Welcome, {user?.firstName || 'User'}
            </h2>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate("/tutorials/create")}
              className="px-4 py-2 text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Tutorial
            </button>

            <button
              onClick={() => navigate("/messages")}
              className="px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Messages
            </button>

            <button
              onClick={() => navigate("/marketplace")}
              className="px-4 py-2 text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
            </button>
            <button
              onClick={() => navigate("/tutorials")}
              className="px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 
                       transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
            </button>
          </div>
        </div>

        <CreatePost onPostCreated={handlePostCreated} />
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Community Feed
          </h2>
          <button 
            onClick={handleRefresh}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isRefreshing ? (
              <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="-ml-1 mr-1 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
                animation: `fadeInUp ${0.5 + (index * 0.1)}s ease-out forwards`,
                opacity: 0
              }}
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-blue-500 rounded-lg opacity-0 group-hover:opacity-10 blur transition-opacity duration-300"></div>
                <Post
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                />
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
              <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 p-0.5 rounded-full animate-gradient-xy">
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
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-gradient-xy {
            background-size: 200% 200%;
            animation: gradient-xy 3s ease infinite;
          }
          .celebration-effect {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%);
            pointer-events: none;
            z-index: 1000;
            animation: fadeOut 1s ease-out forwards;
          }
          @keyframes fadeOut {
            to { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}

export default Home;