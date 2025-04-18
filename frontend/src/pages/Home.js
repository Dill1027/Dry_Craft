import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import axiosInstance from "../utils/axios";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setError(null);
      const response = await axiosInstance.get("/api/posts");
      setPosts(response.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      if (err.code === "ERR_NETWORK") {
        setError("Unable to connect to server. Please try again later.");
      } else if (err.response?.status === 403) {
        navigate("/login");
      } else {
        setError("An error occurred while fetching posts.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(
      posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <CreatePost onPostCreated={handlePostCreated} />
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      ))}
    </div>
  );
}

export default Home;
